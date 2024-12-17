
import { Router } from 'express';
import fs from 'fs';
import { getSingleProductById } from './products.routes.js';

const cartsRoutes = Router();


const getCarts = async () => {
    try {
        const carts = await fs.promises.readFile('src/db/carrito.json', 'utf-8');
        return JSON.parse(carts);
    } catch (error) {
        console.error('Error al leer los carritos:', error);
        return [];
    }
};


const saveCarts = async (carts) => {
    try {
        const cartsString = JSON.stringify(carts, null, 2); 
        await fs.promises.writeFile('src/db/carrito.json', cartsString, 'utf-8');
        return true;
    } catch (error) {
        console.error('Error al guardar los carritos:', error);
        return false;
    }
};


const getSingleCartById = async (cId) => {
    const carts = await getCarts();
    return carts.find((c) => c.id === cId);
};


cartsRoutes.post('/', async (req, res) => {
    const carts = await getCarts();


    const newId = carts.length > 0 ? Math.max(...carts.map((c) => c.id)) + 1 : 1;

    const newCart = {
        id: newId,
        products: [],
    };

    carts.push(newCart);
    const isOk = await saveCarts(carts);

    if (!isOk) {
        return res.status(500).json({ status: 'Error', message: 'Cart could not be created' });
    }

    res.status(201).json({ status: 'Ok', message: 'Cart created', cart: newCart });
});


cartsRoutes.get('/:cid', async (req, res) => {
    const cId = parseInt(req.params.cid);
    const cart = await getSingleCartById(cId);

    if (!cart) {
        return res.status(404).json({ status: 'Error', message: 'Cart not found' });
    }

    res.json({ products: cart.products });
});


cartsRoutes.post('/:cid/product/:pid', async (req, res) => {
    const cId = parseInt(req.params.cid);
    const pId = parseInt(req.params.pid);

    const carts = await getCarts();
    const cart = carts.find((c) => c.id === cId);
    const product = await getSingleProductById(pId);

    if (!cart) {
        return res.status(404).json({ status: 'Error', message: 'Cart not found' });
    }

    if (!product) {
        return res.status(404).json({ status: 'Error', message: 'Product not found' });
    }

    const existingProduct = cart.products.find((p) => p.product === pId);

    if (existingProduct) {
        return res.status(400).json({ status: 'Error', message: 'Product already in cart' });
    }


    cart.products.push({ product: pId });

    const isOk = await saveCarts(carts);

    if (!isOk) {
        return res.status(500).json({ status: 'Error', message: 'Product could not be added to cart' });
    }

    res.json({ status: 'Ok', message: 'Product added to cart', cart });
});

export default cartsRoutes;