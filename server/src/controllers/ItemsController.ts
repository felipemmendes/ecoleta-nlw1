import { Request, Response } from 'express';
import knex from '../database/connection';

export default class ItemsController {
  async index(request: Request, response: Response): Promise<Response> {
    const items = await knex('items').select('*');

    const serializedItems = items.map((item) => {
      return {
        ...item,
        image_url: `http://192.168.0.6:3333/uploads/${item.image}`,
      };
    });

    return response.json(serializedItems);
  }
}
