// swaggerDefinition.ts
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'A description of your API',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Local server',
      },
    ],
  };
  
  export default swaggerDefinition;