import express from "express";
import { userController } from "./controllers/userController";
import { authController } from "./auth/auth.controller";
import { productController } from "./controllers/productController";
import { supermarketController } from "./controllers/supermarketController";
import { inventoryController } from "./controllers/inventoryController";
import { shoppingListController } from "./controllers/shoppingListController";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerDefinition from './swaggerDefinition';

const app = express();
app.use(express.json());

// Swagger configuration
const options = {
  swaggerDefinition,
  apis: ['./controllers/*.ts', './auth/*.ts'], // Include both controller and auth files
};

const specs = swaggerJsdoc(options);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Use the controllers as middleware
app.use('/users', userController);
app.use('/auth', authController);
app.use('/products', productController);
app.use('/supermarket', supermarketController);
app.use('/inventory', inventoryController);
app.use('/shoppingList', shoppingListController);

app.listen(3333, () => {
  console.log("Server running beautifully on http://localhost:3333");
});