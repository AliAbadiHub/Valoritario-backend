"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("./controllers/userController");
const auth_controller_1 = require("./auth/auth.controller");
const productController_1 = require("./controllers/productController");
const supermarketController_1 = require("./controllers/supermarketController");
const inventoryController_1 = require("./controllers/inventoryController");
const shoppingListController_1 = require("./controllers/shoppingListController");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition_1 = __importDefault(require("./swaggerDefinition"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Swagger configuration
const options = {
    swaggerDefinition: swaggerDefinition_1.default,
    apis: ['./controllers/*.{ts,js}', './auth/*.{ts,js}'], // Include both controller and auth files in TypeScript and JavaScript format
};
const specs = (0, swagger_jsdoc_1.default)(options);
// Serve Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Middleware to log routes as they are registered
function logRoutes(req, res, next) {
    const method = req.method.toUpperCase();
    const fullPath = req.originalUrl;
    console.log(`Endpoint: ${method} ${fullPath}`);
    next();
}
app.use(logRoutes);
// Use the controllers as middleware
app.use('/users', userController_1.userController);
app.use('/auth', auth_controller_1.authController);
app.use('/products', productController_1.productController);
app.use('/supermarket', supermarketController_1.supermarketController);
app.use('/inventory', inventoryController_1.inventoryController);
app.use('/shoppingList', shoppingListController_1.shoppingListController);
// Add this function to log the registered routes
function logRegisteredRoutes(app) {
    const registeredRoutes = [];
    function processStack(stack) {
        stack.forEach((layer) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase());
                const fullPath = layer.route.path;
                methods.forEach(method => {
                    registeredRoutes.push(`${method} ${fullPath}`);
                });
            }
            else if (layer.handle.stack) {
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
//# sourceMappingURL=index.js.map