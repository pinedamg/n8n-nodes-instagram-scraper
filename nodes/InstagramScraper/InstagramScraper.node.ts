import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';
import { InstagramScraper as InstagramScraperLibrary } from '@aduptive/instagram-scraper';

export class InstagramScraper implements INodeType { // <-- CAMBIO AQUÍ: Renombramos la clase de tu nodo
    description: INodeTypeDescription = {
        displayName: 'Instagram Scraper',
        name: 'instagramScraper', // El nombre interno del nodo, puede seguir siendo 'instagramScraper'
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
                placeholder: 'e.g., buenosairesparachicos',
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
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const username = this.getNodeParameter('username', 0) as string;
        const limit = this.getNodeParameter('limit', 0) as number;

        const scraper = new InstagramScraperLibrary(); // <-- CAMBIO AQUÍ: Usamos el nuevo nombre de la importación

        try {
            const results = await scraper.getPosts(username, limit);

            if (results.success && results.posts) {
                const returnData = this.helpers.returnJsonArray(results.posts as any[]);
                return [returnData];
            } else if (results.success) {
                // Handle the case where the scrape was successful but no posts were found
                return [this.helpers.returnJsonArray([])];
            } else {
                throw new NodeOperationError(this.getNode(), results.error || 'Unknown scraping error');
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new NodeOperationError(this.getNode(), `Failed to scrape Instagram: ${error.message}`);
            }
            throw new NodeOperationError(this.getNode(), 'An unknown error occurred while scraping Instagram.');
        }
    }
}