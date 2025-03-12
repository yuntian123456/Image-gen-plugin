import { createErrorResponse } from '@lobehub/chat-plugin-sdk';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request) => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const { createGatewayOnEdgeRuntime } = await import('@lobehub/chat-plugins-gateway');
      return createGatewayOnEdgeRuntime()(req);
    } catch (error) {
      console.error('Gateway error:', error);
      return createErrorResponse(500, `Gateway error: ${error}`);
    }
  }

  return createErrorResponse(404, 'Gateway only available in development mode');
};

export default handler;
