import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  const response = await api.get('orders/cart/');
  return response.data;
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, quantity }) => {
  const response = await api.post('orders/cart/add/', { product_id: productId, quantity });
  return response.data;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalPrice: 0,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalPrice = action.payload.total_price || 0;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
        state.totalPrice = action.payload.total_price || 0;
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
