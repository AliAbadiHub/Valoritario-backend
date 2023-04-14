"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Valoritario',
        version: '1.0.0',
        description: 'The price tracking application',
    },
    servers: [
        {
            url: 'http://localhost:3333',
            description: 'Local server',
        },
    ],
    tags: [
        {
            name: 'Users',
            description: 'User management',
        },
        {
            name: 'Products',
            description: 'Product management',
        },
        {
            name: 'Supermarkets',
            description: 'Supermarket management',
        },
        {
            name: 'Inventory',
            description: 'Inventory management',
        },
        {
            name: 'ShoppingList',
            description: 'Shopping list management',
        },
    ],
};
exports.default = swaggerDefinition;
//# sourceMappingURL=swaggerDefinition.js.map