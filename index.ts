import express, { Request, Response, NextFunction, Application } from "express";
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

// Middleware to log routes as they are registered
function logRoutes(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const fullPath = req.originalUrl;
  console.log(`Endpoint: ${method} ${fullPath}`);
  next();
}

app.use(logRoutes);

// Use the controllers as middleware
app.use('/users', userController);
app.use('/auth', authController);
app.use('/products', productController);
app.use('/supermarket', supermarketController);
app.use('/inventory', inventoryController);
app.use('/shoppingList', shoppingListController);

// Add this function to log the registered routes
function logRegisteredRoutes(app: Application) {
  const registeredRoutes: string[] = [];

  function processStack(stack: any) {
    stack.forEach((layer: any) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase());
        const fullPath = layer.route.path;
        methods.forEach(method => {
          registeredRoutes.push(`${method} ${fullPath}`);
        });
      } else if (layer.handle.stack) {
        processStack(layer.handle.stack);
      }
    });
  }

  processStack(app._router.stack);

  console.log('Registered Routes:');
  registeredRoutes.forEach(route => console.log(route));
}

// Call the logRegisteredRoutes function after registering all controllers
logRegisteredRoutes(app);

app.listen(3333, () => {
  console.log("Server running beautifully on http://localhost:3333");
});