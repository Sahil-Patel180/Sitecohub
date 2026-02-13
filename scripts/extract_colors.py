
import argparse
import json
import os
import re
import sys
import logging
import requests
from urllib.parse import urljoin, urlparse
from collections import Counter
from datetime import datetime
from bs4 import BeautifulSoup
import cssutils

# Force UTF-8 encoding for stdout/stderr to satisfy Windows terminals
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Suppress cssutils logging
cssutils.log.setLevel(logging.CRITICAL)

class WebsiteColorFetcher:
    def __init__(self, base_url, max_pages=5):
        self.base_url = base_url
        self.max_pages = max_pages
        self.visited_urls = set()
        self.all_colors = Counter()
        self.text_colors = Counter()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def is_valid_url(self, url):
        parsed = urlparse(url)
        return bool(parsed.netloc) and bool(parsed.scheme) and self.base_url in url

    def extract_colors_from_css(self, css_text):
        colors = []
        try:
            # Simple regex for hex codes to avoid cssutils parsing errors on modern CSS
            hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', css_text)
            colors.extend([c.upper() for c in hex_colors])
            
            # TODO: Add rgb/rgba parsing if needed
        except Exception as e:
            pass
        return colors

    def extract_colors_from_html(self, soup):
        colors = []
        text_colors = []
        
        # Check inline styles
        for tag in soup.find_all(True):
            style = tag.get('style')
            if style:
                hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', style)
                colors.extend([c.upper() for c in hex_colors])
                
                if 'color:' in style:
                     text_hex = re.findall(r'color:\s*(#(?:[0-9a-fA-F]{3}){1,2}\b)', style)
                     text_colors.extend([c.upper() for c in text_hex])

        # Check style tags
        for style in soup.find_all('style'):
            if style.string:
                colors.extend(self.extract_colors_from_css(style.string))

        return colors, text_colors

    def crawl_page(self, url):
        if url in self.visited_urls or len(self.visited_urls) >= self.max_pages:
            return []
        
        self.visited_urls.add(url)
        print(f"Crawling: {url}")
        
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            page_colors, page_text_colors = self.extract_colors_from_html(soup)
            self.all_colors.update(page_colors)
            self.text_colors.update(page_text_colors)
            
            links = []
            for a in soup.find_all('a', href=True):
                full_url = urljoin(url, a['href'])
                if self.is_valid_url(full_url) and full_url not in self.visited_urls:
                    links.append(full_url)
            
            return links
        except Exception as e:
            print(f"Request error for {url}: {e}")
            return []

    def crawl_website(self):
        queue = [self.base_url]
        while queue and len(self.visited_urls) < self.max_pages:
            url = queue.pop(0)
            new_links = self.crawl_page(url)
            queue.extend(new_links)

    def get_results(self):
        """Get analysis results"""
        return {
            'website': self.base_url,
            'timestamp': datetime.now().isoformat(),
            'total_pages_analyzed': len(self.visited_urls),
            'total_unique_colors': len(self.all_colors),
            'total_unique_text_colors': len(self.text_colors),
            'top_6_colors': [{'hex': color, 'count': count} for color, count in self.all_colors.most_common(6)],
            'all_colors': [{'hex': color, 'count': count} for color, count in self.all_colors.most_common()],
            'text_colors': [{'hex': color, 'count': count} for color, count in self.text_colors.most_common()],
            'pages_crawled': list(self.visited_urls)
        }

def main():
    parser = argparse.ArgumentParser(description='Extract colors from website')
    parser.add_argument('--source', required=True, help='Source file path (realSites.ts) or URL')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--max-pages', type=int, default=5, help='Maximum pages to crawl per site')
    
    args = parser.parse_args()

    # Load source sites
    # This is a bit hacky to parse TS file as text but works for the structure we have
    sites = []
    try:
        with open(args.source, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract url: "url": "https://..." or url: "https://..."
            matches = re.findall(r"[\"']?url[\"']?\s*:\s*[\"'](https?://[^\"']+)[\"']", content)
            sites = list(set(matches)) # Unique URLs
    except Exception as e:
        print(f"Error reading source file: {e}")
        return

    results = []
    failed_sites = []
    
    total_sites = len(sites)
    print(f"Found {total_sites} sites to process.")

    for i, url in enumerate(sites):
        print(f"[{i+1}/{total_sites}] Processing {url}...")
        try:
            fetcher = WebsiteColorFetcher(url, args.max_pages)
            fetcher.crawl_website()
            result = fetcher.get_results()
            
            if result['total_unique_colors'] > 0:
                results.append(result)
            else:
                failed_sites.append({'url': url, 'reason': 'No colors found'})
                
        except Exception as e:
            print(f"Failed to process {url}: {e}")
            failed_sites.append({'url': url, 'reason': str(e)})

    # Write output
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {args.output}")
    except Exception as e:
        print(f"Error writing output: {e}")

    # Summary
    print("\n" + "="*50)
    print("EXTRACTION SUMMARY")
    print("="*50)
    print(f"Total Sites: {total_sites}")
    print(f"Successfully Extracted: {len(results)}")
    print(f"Failed/No Colors: {len(failed_sites)}")
    
    if failed_sites:
        print("\nFailed Sites:")
        for fail in failed_sites:
            print(f"- {fail['url']}: {fail['reason']}")
    print("="*50 + "\n")

if __name__ == '__main__':
    main()
