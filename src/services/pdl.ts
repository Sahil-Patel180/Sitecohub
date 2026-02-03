export interface PDLCompanyResponse {
    status: number;
    data?: any;
    error?: string;
}

export async function fetchCompanyData(website: string, apiKey: string): Promise<PDLCompanyResponse> {
    const url = `https://api.peopledatalabs.com/v5/company/enrich?website=${encodeURIComponent(website)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            let errorMsg = `Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMsg = errorData.error;
                }
            } catch (e) {
                // ignore JSON parse error
            }
            return { status: response.status, error: errorMsg };
        }

        const data = await response.json();
        return { status: response.status, data };
    } catch (error: any) {
        return { status: 500, error: error.message || "Network error" };
    }
}
