import api from './api';

interface CartItem {
  foodId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export const fetchCart = async (): Promise<Cart> => {
  const response = await api.get<Cart>('/cart');
  return response.data;
};

export const addToCartServer = async (foodId: string, quantity: number): Promise<Cart> => {
  const response = await api.post<Cart>('/cart', { foodId, quantity });
  return response.data;
};

export const updateCartItemServer = async (foodId: string, quantity: number): Promise<Cart> => {
  const response = await api.put<Cart>(`/cart/${foodId}`, { quantity });
  return response.data;
};

export const clearCartServer = async (): Promise<void> => {
  await api.delete('/cart');
};

export default {
  fetchCart,
  addToCartServer,
  updateCartItemServer,
  clearCartServer,
};
