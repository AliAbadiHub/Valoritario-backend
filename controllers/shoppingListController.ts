import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authGuard } from '../auth/auth.guard';
import { CustomRequest } from '../types';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /shoppingList:
 *   post:
 *     summary: Create a new shopping list
 *     tags: [ShoppingList]
 *     description: Create a new shopping list with the provided city and shopping items.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *                 description: The city where the shopping will take place.
 *               shoppingItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       description: The product ID.
 *                     quantity:
 *                       type: integer
 *                       description: The quantity of the product.
 *             example:
 *               city: "New York"
 *               shoppingItems:
 *                 - productId: 1
 *                   quantity: 2
 *     responses:
 *       201:
 *         description: The created shopping list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userEmail:
 *                   type: string
 *                   description: The user's email.
 *                 currentDate:
 *                   type: string
 *                   format: date-time
 *                   description: The current date.
 *                 city:
 *                   type: string
 *                   description: The city where the shopping will take place.
 *                 shoppingItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productName:
 *                         type: string
 *                         description: The product's name.
 *                       supermarketName:
 *                         type: string
 *                         description: The supermarket's name.
 *                       quantity:
 *                         type: integer
 *                         description: The quantity of the product.
 *                       lowestPrice:
 *                         type: number
 *                         format: float
 *                         description: The lowest price for the product.
 *                       subtotal:
 *                         type: number
 *                         format: float
 *                         description: The subtotal price for the product.
 *                 total:
 *                   type: number
 *                   format: float
 *                   description: The total price of the shopping list.
 *       500:
 *         description: An error occurred while creating the shopping list.
 */
// Create a new shopping list
router.post('/', authGuard, async (req: CustomRequest, res: Response) => {
  const { city, shoppingItems } = req.body;
  const currentDate = new Date();

  try {
    const shoppingItemsWithPrices = [];

    for (const item of shoppingItems) {
      const inventoryItem = await prisma.inventory.findFirst({
        where: {
          supermarket: {
            city: city,
          },
          productId: item.productId,
          inStock: true,
        },
        orderBy: {
          price: 'asc',
        },
        include: {
          supermarket: true,
          product: true,
        },
      });

      if (inventoryItem) {
        shoppingItemsWithPrices.push({
          productName: inventoryItem.product.productName,
          supermarketName: inventoryItem.supermarket.supermarketName,
          quantity: item.quantity,
          lowestPrice: inventoryItem.price,
          subtotal: parseFloat((inventoryItem.price * item.quantity).toFixed(2)),
        });
      } else {
        shoppingItemsWithPrices.push({
          productName: `Product with ID ${item.productId} not found in ${city}`,
          supermarketName: 'N/A',
          quantity: item.quantity,
          lowestPrice: 0,
          subtotal: 0,
        });
      }
    }

    const total = parseFloat(shoppingItemsWithPrices.reduce(
      (accumulator, currentItem) => accumulator + currentItem.subtotal,
      0
    ).toFixed(2)
    );

    res.status(201).json({
      userEmail: req.user.email,
      currentDate: currentDate,
      city: city,
      shoppingItems: shoppingItemsWithPrices,
      total: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the shopping list.' });
  }
});

export { router as shoppingListController };