import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    IDataObject,
} from 'n8n-workflow';
import { InstagramScraper as InstagramScraperLibrary, ScrapeError, ScraperConfig } from '@aduptive/instagram-scraper'; // <-- Importa ScrapeError y ScraperConfig

export class InstagramScraper implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Instagram Scraper',
        name: 'instagramScraper',
        icon: 'file:instagram.svg',
        group: ['transform'],
        version: 1,
        description: 'Scrapes posts from a public Instagram profile.',
        defaults: {
            name: 'Instagram Scraper',
        },
        inputs: ['main'] as any,
        outputs: ['main'] as any,
        properties: [
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'e.g., n8n.io',
                description: 'The public Instagram profile username to scrape',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                typeOptions: {
                    minValue: 1,
                },
                default: 50,
                description: 'Max number of results to return',
            },
            {
                displayName: 'Scraper Configuration',
                name: 'scraperConfig',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Max Delay (Ms)',
                        name: 'maxDelay',
                        type: 'number',
                        default: 5000, // Ajustado según docs de la librería (default: 5000)
                        description: 'Maximum delay between requests in milliseconds (default: 5000)',
                        typeOptions: { minValue: 0 },
                    },
                    {
                        displayName: 'Max Retries',
                        name: 'maxRetries',
                        type: 'number',
                        default: 3,
                        description: 'Maximum number of retry attempts (default: 3)',
                        typeOptions: { minValue: 0 },
                    },
                    {
                        displayName: 'Min Delay (Ms)',
                        name: 'minDelay',
                        type: 'number',
                        default: 2000, // Ajustado según docs de la librería (default: 2000)
                        description: 'Minimum delay between requests in milliseconds (default: 2000)',
                        typeOptions: { minValue: 0 },
                    },
                    {
                        displayName: 'Rate Limit Per Minute',
                        name: 'rateLimitPerMinute',
                        type: 'number',
                        default: 30,
                        description: 'Maximum requests per minute (default: 30)',
                        typeOptions: { minValue: 0 },
                    },
                    {
                        displayName: 'Timeout (Ms)',
                        name: 'timeout',
                        type: 'number',
                        default: 10000,
                        description: 'Request timeout in milliseconds (default: 10000)',
                        typeOptions: { minValue: 0 },
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const username = this.getNodeParameter('username', 0) as string;
        const limit = this.getNodeParameter('limit', 0) as number;
        const scraperConfig = this.getNodeParameter('scraperConfig', 0) as IDataObject; // Lee las opciones de configuración del UI

        // Crea un objeto de configuración para el scraper, usando los valores del UI
        const config: ScraperConfig = {
            maxRetries: scraperConfig.maxRetries as number | undefined,
            minDelay: scraperConfig.minDelay as number | undefined,
            maxDelay: scraperConfig.maxDelay as number | undefined,
            timeout: scraperConfig.timeout as number | undefined,
            rateLimitPerMinute: scraperConfig.rateLimitPerMinute as number | undefined,
        };

        const scraper = new InstagramScraperLibrary(config); // Pasa la configuración al constructor de la librería

        try {
            const results = await scraper.getPosts(username, limit);

            if (results.success && results.posts) {
                const returnData = this.helpers.returnJsonArray(results.posts as any[]);
                return [returnData];
            } else if (results.success) {
                // Maneja el caso en que el scrape fue exitoso pero no se encontraron posts
                return [this.helpers.returnJsonArray([])];
            } else {
                // Si results.success es false y results.error tiene un mensaje de la librería
                throw new NodeOperationError(this.getNode(), results.error || 'Unknown scraping error');
            }
        } catch (error) {
            if (error instanceof ScrapeError) { // <-- Manejo específico para ScrapeError
                throw new NodeOperationError(
                    this.getNode(),
                    `Failed to scrape Instagram: ${error.message} (Code: ${error.code})`
                );
            } else if (error instanceof Error) {
            throw new NodeOperationError(
                this.getNode(),
                `Failed to scrape Instagram: ${error.message}`
            );
        } else {
            throw new NodeOperationError(this.getNode(), 'An unknown error occurred while scraping Instagram.');
        }
    }
    // Add a fallback return to satisfy the function's return type
    return [[]];
}
}