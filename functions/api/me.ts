import { json, type ApiContext } from "./_middleware";

export const onRequestGet = (context: ApiContext) => json(context.data.identity);
