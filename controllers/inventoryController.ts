import { Router, Request, Response } from 'express';
import { PrismaClient, ProductCategory } from '@prisma/client';
import { CustomRequest } from '../types';
import { authGuard } from '../auth/auth.guard';

const router = Router();
const prisma = new PrismaClient();

// Helper function to convert string to ProductCategory enum
function toProductCategory(category: string): ProductCategory | null {
  if (Object.values(ProductCategory).includes(category as ProductCategory)) {
    return category as ProductCategory;
  }
  return null;
}

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create a new inventory entry
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - productId
 *               - supermarketId
 *             properties:
 *               price:
 *                 type: number
 *               productId:
 *                 type: string
 *               supermarketId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created inventory entry
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while creating the inventory entry
 */
// Create a new inventory entry (accessible to VERIFIED and ADMIN roles)
router.post('/', authGuard, async (req: CustomRequest, res: Response) => {
  if (req.user.role !== 'VERIFIED' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { price, productId, supermarketId } = req.body;

  try {
    const newInventory = await prisma.inventory.create({
      data: {
        price,
        product: {
          connect: {
            productId,
          },
        },
        supermarket: {
          connect: {
            supermarketId,
          },
        },
        createdBy: {
          connect: {
            userId: req.user.userId,
          },
        },
        updatedBy: {
          connect: {
            userId: req.user.userId,
          },
        },
      },
      // Include product and supermarket to fetch productName and supermarketName
      include: {
        product: true,
        supermarket: true,
      },
    });

    // Include productName and supermarketName in the response
    res.status(201).json({
      ...newInventory,
      productName: newInventory.product.productName,
      supermarketName: newInventory.supermarket.supermarketName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the inventory entry.' });
  }
});
/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory entries
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of inventory entries
 *       500:
 *         description: An error occurred while fetching inventory entries
 */
router.get('/', authGuard, async (req: CustomRequest, res: Response) => {
  try {
    const inventories = await prisma.inventory.findMany({
      select: {
        price: true,
        inStock: true,
        updatedAt: true,
        product: {
          select: {
            productName: true,
          },
        },
        supermarket: {
          select: {
            supermarketName: true,
          },
        },
      },
    });

    // Map the data to the desired format
    const formattedInventories = inventories.map((inventory) => ({
      productName: inventory.product.productName,
      supermarketName: inventory.supermarket.supermarketName,
      price: inventory.price,
      inStock: inventory.inStock,
      updatedAt: inventory.updatedAt,
    }));

    res.json(formattedInventories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching inventory entries.' });
  }
});

/**
 * @swagger
 * /inventory/cheapest/{productId}/{city}:
 *   get:
 *     summary: Find the cheapest listing of a product in a city
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product
 *       - in: path
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: The city name
 *     responses:
 *       200:
 *         description: The cheapest listing of the product in the city
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: No listing found for the given product and city
 *       500:
 *         description: An error occurred while fetching the cheapest listing
 */
router.get('/cheapest/:productId/:city', authGuard, async (req: CustomRequest, res: Response) => {
  const allowedRoles = ['BASIC', 'VERIFIED', 'ADMIN'];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { productId, city } = req.params;

  try {
    const cheapestListing = await prisma.inventory.findFirst({
      where: {
        productId,
        inStock: true,
        supermarket: {
          city,
        },
      },
      orderBy: {
        price: 'asc',
      },
      select: {
        price: true,
        inStock: true,
        updatedAt: req.user.role === 'ADMIN',
        updatedBy: req.user.role === 'ADMIN' ? { select: { email: true, userId: true } } : undefined,
        supermarket: {
          select: {
            supermarketName: true,
          },
        },
        product: {
          select: {
            productName: true,
          },
        },
      },
    });

    if (!cheapestListing) {
      return res.status(404).json({ message: 'No listing found for the given product and city.' });
    }

    res.json(cheapestListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the cheapest listing.' });
  }
});

/**
 * @swagger
 * /inventory/supermarket/{supermarketId}:
 *   get:
 *     summary: Get all inventory items in a given supermarket
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: supermarketId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the supermarket
 *     responses:
 *       200:
 *         description: The list of items in the supermarket
 *       404:
 *         description: No items found in the given supermarket
 *       500:
 *         description: An error occurred while fetching the items in the supermarket
 */
router.get('/supermarket/:supermarketId', async (req: Request, res: Response) => {
  const { supermarketId } = req.params;

  try {
    const itemsInSupermarket = await prisma.inventory.findMany({
      where: {
        supermarketId,
      },
      select: {
        price: true,
        inStock: true,
        updatedAt: true,
        supermarket: {
          select: {
            supermarketName: true,
          },
        },
        product: {
          select: {
            productName: true,
          },
        },
      },
    });

    if (!itemsInSupermarket || itemsInSupermarket.length === 0) {
      return res.status(404).json({ message: 'No items found in the given supermarket.' });
    }

    res.json(itemsInSupermarket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the items in the supermarket.' });
  }
});

/**
 * @swagger
 * /inventory/category/{city}/{productCategory}:
 *   get:
 *     summary: Get the lowest price of every item in a given product category within a city
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: The city name
 *       - in: path
 *         name: productCategory
 *         schema:
 *           type: string
 *         required: true
 *         description: The product category
 *     responses:
 *       200:
 *         description: The list of products and their lowest prices in the specified category and city
 *       400:
 *         description: Invalid product category
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while fetching the products by category
 */
router.get('/category/:city/:productCategory', authGuard, async (req: CustomRequest, res: Response) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'VERIFIED') {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { city, productCategory } = req.params;

  // Convert the productCategory string to the appropriate enum
  const categoryEnum = toProductCategory(productCategory);

  if (!categoryEnum) {
    return res.status(400).json({ message: 'Invalid product category.' });
  }

  try {
    const productList = await prisma.product.findMany({
      where: {
        productCategory: categoryEnum,
        inventory: {
          some: {
            supermarket: {
              city: city,
            },
            inStock: true,
          },
        },
      },
      select: {
        productName: true,
        inventory: {
          where: {
            supermarket: {
              city: city,
            },
            inStock: true,
          },
          orderBy: {
            price: 'asc',
          },
          take: 1,
          select: {
            price: true,
            supermarket: {
              select: {
                supermarketName: true,
              },
            },
          },
        },
      },
    });

    res.json(productList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the products by category.' });
  }
});



/**
 * @swagger
 * /inventory/{supermarketId}/{productId}:
 *   patch:
 *     summary: Update an existing inventory entry
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supermarketId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the supermarket
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - inStock
 *             properties:
 *               price:
 *                 type: number
 *               inStock:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The updated inventory entry
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while updating the inventory entry
 */
router.patch('/:supermarketId/:productId', authGuard, async (req: CustomRequest, res: Response) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'VERIFIED') {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { supermarketId, productId } = req.params;
  const { price, inStock } = req.body;

  try {
    const updatedInventory = await prisma.inventory.update({
      where: {
        supermarketId_productId: {
          supermarketId,
          productId,
        },
      },
      data: {
        price,
        inStock,
        updatedAt: new Date(),
        updatedBy: {
          connect: {
            userId: req.user.userId,
          },
        },
      },
    });

    res.json(updatedInventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the inventory entry.' });
  }
});

/**
 * @swagger
 * /inventory/{supermarketId}/{productId}:
 *   delete:
 *     summary: Delete an inventory entry
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supermarketId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the supermarket
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product
 *     responses:
 *       204:
 *         description: Inventory entry deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: An error occurred while deleting the inventory entry
 */
router.delete('/:supermarketId/:productId', authGuard, async (req: CustomRequest, res: Response) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Insufficient permissions.' });
  }

  const { supermarketId, productId } = req.params;

  try {
    await prisma.inventory.delete({
      where: {
        supermarketId_productId: {
          supermarketId,
          productId,
        },
      },
    });

    res.status(204).json({ message: 'Inventory entry deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the inventory entry.' });
}
});

export { router as inventoryController };