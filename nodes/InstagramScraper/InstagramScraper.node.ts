import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { InstagramScraper } from '@aduptive/instagram-scraper';

export class InstagramScraperNode implements INodeType {
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
                placeholder: 'e.g., buenosairesparachicos',
                description: 'The public Instagram profile username to scrape.',
            },
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 20,
                description: 'The maximum number of posts to return.',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const username = this.getNodeParameter('username', 0) as string;
        const limit = this.getNodeParameter('limit', 0) as number;

        const scraper = new InstagramScraper();

        try {
            const results = await scraper.getPosts(username, limit);

            if (results.success && results.posts) {
                const returnData = this.helpers.returnJsonArray(results.posts as any[]);
                return [returnData];
            } else if (results.success) {
                // Handle the case where the scrape was successful but no posts were found
                return [this.helpers.returnJsonArray([])];
            } else {
                throw new Error(results.error);
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to scrape Instagram: ${error.message}`);
            }
            throw new Error('An unknown error occurred while scraping Instagram.');
        }
    }
}
