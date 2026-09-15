// Repository Pattern for Unified Cart Data Access
export interface CartRepository {
  getCart(userId: number, restaurantId: number): Promise<CartData | null>;
  createCart(userId: number, restaurantId: number): Promise<number>;
  addItemToCart(cartId: number, item: CartItemData): Promise<boolean>;
  updateCartItem(itemId: number, quantity: number): Promise<boolean>;
  removeCartItem(itemId: number): Promise<boolean>;
  clearCart(cartId: number): Promise<boolean>;
  deleteCart(cartId: number): Promise<boolean>;
}

export interface CartData {
  id: number;
  user_id: number;
  restaurant_id: number;
  created_at: string;
  updated_at: string;
  items: CartItemData[];
  restaurant_name?: string;
}

export interface CartItemData {
  id?: number;
  cart_id?: number;
  food_id?: number;
  deal_id?: number;
  item_type: 'food' | 'deal';
  quantity: number;
  unit_price: number;
  item_name?: string;
  item_image?: string;
  item_description?: string;
  created_at?: string;
  updated_at?: string;
}

// Composite Pattern for Cart Items
export abstract class CartItemComponent {
  abstract getId(): number;
  abstract getName(): string;
  abstract getPrice(): number;
  abstract getQuantity(): number;
  abstract getType(): 'food' | 'deal';
  abstract getImage(): string | undefined;
  abstract getDescription(): string | undefined;
  abstract getTotalPrice(): number;
}

export class FoodCartItem extends CartItemComponent {
  constructor(
    private id: number,
    private name: string,
    private price: number,
    private quantity: number,
    private image?: string,
    private description?: string
  ) {
    super();
  }

  getId(): number { return this.id; }
  getName(): string { return this.name; }
  getPrice(): number { return this.price; }
  getQuantity(): number { return this.quantity; }
  getType(): 'food' | 'deal' { return 'food'; }
  getImage(): string | undefined { return this.image; }
  getDescription(): string | undefined { return this.description; }
  getTotalPrice(): number { return this.price * this.quantity; }
}

export class DealCartItem extends CartItemComponent {
  constructor(
    private id: number,
    private name: string,
    private price: number,
    private quantity: number,
    private description?: string
  ) {
    super();
  }

  getId(): number { return this.id; }
  getName(): string { return this.name; }
  getPrice(): number { return this.price; }
  getQuantity(): number { return this.quantity; }
  getType(): 'food' | 'deal' { return 'deal'; }
  getImage(): string | undefined { return undefined; }
  getDescription(): string | undefined { return this.description; }
  getTotalPrice(): number { return this.price * this.quantity; }
}

// Factory Pattern for creating cart items
export class CartItemFactory {
  static createCartItem(
    type: 'food' | 'deal',
    id: number,
    name: string,
    price: number,
    quantity: number,
    image?: string,
    description?: string
  ): CartItemComponent {
    switch (type) {
      case 'food':
        return new FoodCartItem(id, name, price, quantity, image, description);
      case 'deal':
        return new DealCartItem(id, name, price, quantity, description);
      default:
        throw new Error(`Unsupported cart item type: ${type}`);
    }
  }
}

export class SupabaseCartRepository implements CartRepository {
  async getCart(userId: number, restaurantId: number): Promise<CartData | null> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('shopping_carts')
        .select(`
          *,
          restaurant_user!inner(name),
          cart_items(
            id,
            food_id,
            deal_id,
            item_type,
            quantity,
            unit_price,
            created_at,
            updated_at,
            food(id, name, image_url, description, price),
            deals(id, deal_name, description, deal_price)
          )
        `)
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching cart:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Transform the data to match our interface
      const cartData: CartData = {
        id: data.id,
        user_id: data.user_id,
        restaurant_id: data.restaurant_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        restaurant_name: (data as any).restaurant_user?.name,
        items: (data.cart_items || []).map((item: any) => ({
          id: item.id,
          cart_id: data.id,
          food_id: item.food_id,
          deal_id: item.deal_id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_name: item.food?.name || item.deals?.deal_name,
          item_image: item.food?.image_url,
          item_description: item.food?.description || item.deals?.description,
          created_at: item.created_at,
          updated_at: item.updated_at
        }))
      };

      return cartData;
    } catch (error) {
      console.error('Error in getCart:', error);
      return null;
    }
  }

  async createCart(userId: number, restaurantId: number): Promise<number> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('shopping_carts')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating cart:', error);
        return 0;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createCart:', error);
      return 0;
    }
  }

  async addItemToCart(cartId: number, item: CartItemData): Promise<boolean> {
    try {
      const { supabase } = await import('../supabase');

      // Check if item already exists in cart (same type and ID)
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('item_type', item.item_type)
        .eq(item.item_type === 'food' ? 'food_id' : 'deal_id', item.food_id || item.deal_id)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + item.quantity })
          .eq('id', existingItem.id);

        if (error) {
          console.error('Error updating cart item quantity:', error);
          return false;
        }
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            food_id: item.food_id || null,
            deal_id: item.deal_id || null,
            item_type: item.item_type,
            quantity: item.quantity,
            unit_price: item.unit_price
          });

        if (error) {
          console.error('Error adding item to cart:', error);
          return false;
        }
      }

      // Update cart's updated_at timestamp
      await supabase
        .from('shopping_carts')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', cartId);

      return true;
    } catch (error) {
      console.error('Error in addItemToCart:', error);
      return false;
    }
  }

  async updateCartItem(itemId: number, quantity: number): Promise<boolean> {
    try {
      const { supabase } = await import('../supabase');

      if (quantity <= 0) {
        return await this.removeCartItem(itemId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating cart item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      return false;
    }
  }

  async removeCartItem(itemId: number): Promise<boolean> {
    try {
      const { supabase } = await import('../supabase');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing cart item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeCartItem:', error);
      return false;
    }
  }

  async clearCart(cartId: number): Promise<boolean> {
    try {
      const { supabase } = await import('../supabase');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        console.error('Error clearing cart:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      return false;
    }
  }

  async deleteCart(cartId: number): Promise<boolean> {
    try {
      const { supabase } = await import('../supabase');

      // First clear all items (cascade should handle this, but being explicit)
      await this.clearCart(cartId);

      // Then delete the cart
      const { error } = await supabase
        .from('shopping_carts')
        .delete()
        .eq('id', cartId);

      if (error) {
        console.error('Error deleting cart:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCart:', error);
      return false;
    }
  }
}

// Command Pattern for Cart Operations
export interface CartCommand {
  execute(): Promise<{ success: boolean; error?: string; data?: any }>;
}

export class AddToCartCommand implements CartCommand {
  constructor(
    private repository: CartRepository,
    private userId: number,
    private restaurantId: number,
    private item: {
      id: number;
      name: string;
      price: number;
      quantity: number;
      type: 'food' | 'deal';
      image?: string;
      description?: string;
    }
  ) {}

  async execute(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Get or create unified cart (no cart type needed)
      let cart = await this.repository.getCart(this.userId, this.restaurantId);
      
      if (!cart) {
        const cartId = await this.repository.createCart(this.userId, this.restaurantId);
        if (!cartId) {
          return { success: false, error: 'Failed to create cart' };
        }
        
        cart = await this.repository.getCart(this.userId, this.restaurantId);
        if (!cart) {
          return { success: false, error: 'Failed to retrieve created cart' };
        }
      }

      // Add item to cart with item type
      const cartItem: CartItemData = {
        cart_id: cart.id,
        item_type: this.item.type,
        quantity: this.item.quantity,
        unit_price: this.item.price
      };

      if (this.item.type === 'food') {
        cartItem.food_id = this.item.id;
      } else {
        cartItem.deal_id = this.item.id;
      }

      const success = await this.repository.addItemToCart(cart.id, cartItem);
      
      if (success) {
        // Return updated cart data
        const updatedCart = await this.repository.getCart(this.userId, this.restaurantId);
        return { success: true, data: updatedCart };
      } else {
        return { success: false, error: 'Failed to add item to cart' };
      }
    } catch (error) {
      console.error('Error in AddToCartCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class UpdateCartItemCommand implements CartCommand {
  constructor(
    private repository: CartRepository,
    private itemId: number,
    private quantity: number
  ) {}

  async execute(): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await this.repository.updateCartItem(this.itemId, this.quantity);
      return { success, error: success ? undefined : 'Failed to update cart item' };
    } catch (error) {
      console.error('Error in UpdateCartItemCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class RemoveFromCartCommand implements CartCommand {
  constructor(
    private repository: CartRepository,
    private itemId: number
  ) {}

  async execute(): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await this.repository.removeCartItem(this.itemId);
      return { success, error: success ? undefined : 'Failed to remove item from cart' };
    } catch (error) {
      console.error('Error in RemoveFromCartCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class ClearCartCommand implements CartCommand {
  constructor(
    private repository: CartRepository,
    private cartId: number
  ) {}

  async execute(): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await this.repository.clearCart(this.cartId);
      return { success, error: success ? undefined : 'Failed to clear cart' };
    } catch (error) {
      console.error('Error in ClearCartCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Service Layer for Unified Cart Management
export class CartService {
  private repository: CartRepository;

  constructor(repository?: CartRepository) {
    this.repository = repository || new SupabaseCartRepository();
  }

  async getCart(userId: number, restaurantId: number): Promise<CartData | null> {
    return await this.repository.getCart(userId, restaurantId);
  }

  async addToCart(
    userId: number,
    restaurantId: number,
    item: {
      id: number;
      name: string;
      price: number;
      quantity: number;
      type: 'food' | 'deal';
      image?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; error?: string; cart?: CartData }> {
    const command = new AddToCartCommand(this.repository, userId, restaurantId, item);
    const result = await command.execute();
    
    return {
      success: result.success,
      error: result.error,
      cart: result.data
    };
  }

  async updateCartItem(itemId: number, quantity: number): Promise<{ success: boolean; error?: string }> {
    const command = new UpdateCartItemCommand(this.repository, itemId, quantity);
    return await command.execute();
  }

  async removeFromCart(itemId: number): Promise<{ success: boolean; error?: string }> {
    const command = new RemoveFromCartCommand(this.repository, itemId);
    return await command.execute();
  }

  async clearCart(cartId: number): Promise<{ success: boolean; error?: string }> {
    const command = new ClearCartCommand(this.repository, cartId);
    return await command.execute();
  }

  async deleteCart(cartId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await this.repository.deleteCart(cartId);
      return { success, error: success ? undefined : 'Failed to delete cart' };
    } catch (error) {
      console.error('Error in deleteCart:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Strategy Pattern for cart item grouping
  groupCartItems(cart: CartData, strategy: 'type' | 'name' | 'price'): { [key: string]: CartItemData[] } {
    if (!cart.items || cart.items.length === 0) {
      return {};
    }

    switch (strategy) {
      case 'type':
        return this.groupByType(cart.items);
      case 'name':
        return this.groupByName(cart.items);
      case 'price':
        return this.groupByPrice(cart.items);
      default:
        return { 'All Items': cart.items };
    }
  }

  private groupByType(items: CartItemData[]): { [key: string]: CartItemData[] } {
    const grouped: { [key: string]: CartItemData[] } = {
      'Food Items': [],
      'Deals': []
    };

    items.forEach(item => {
      if (item.item_type === 'food') {
        grouped['Food Items'].push(item);
      } else {
        grouped['Deals'].push(item);
      }
    });

    // Remove empty groups
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  private groupByName(items: CartItemData[]): { [key: string]: CartItemData[] } {
    return items.reduce((groups, item) => {
      const firstLetter = (item.item_name || 'Unknown').charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(item);
      return groups;
    }, {} as { [key: string]: CartItemData[] });
  }

  private groupByPrice(items: CartItemData[]): { [key: string]: CartItemData[] } {
    const grouped: { [key: string]: CartItemData[] } = {
      'Under $10': [],
      '$10 - $20': [],
      'Over $20': []
    };

    items.forEach(item => {
      if (item.unit_price < 10) {
        grouped['Under $10'].push(item);
      } else if (item.unit_price <= 20) {
        grouped['$10 - $20'].push(item);
      } else {
        grouped['Over $20'].push(item);
      }
    });

    // Remove empty groups
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }

  calculateCartTotal(cart: CartData): number {
    if (!cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  }

  getCartItemCount(cart: CartData): number {
    if (!cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}

// Factory for creating cart service
export class CartServiceFactory {
  static createService(): CartService {
    const repository = new SupabaseCartRepository();
    return new CartService(repository);
  }
}