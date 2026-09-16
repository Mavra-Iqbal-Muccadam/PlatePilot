// Simplified Order System - No discrimination between food and deals
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'food' | 'deal'; // Only for internal logic, not stored as order_type
}

export interface OrderData {
  userId: number;
  restaurantId: number;
  items: OrderItem[];
  deliveryAddress?: string;
  phoneNumber?: string;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  deliveryAddress?: string;
  phoneNumber?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

// Simplified Order Strategy - No need for different strategies
export class UnifiedOrderStrategy {
  calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  validateOrder(orderData: OrderData): { isValid: boolean; error?: string } {
    if (!orderData.items || orderData.items.length === 0) {
      return { isValid: false, error: 'No items selected' };
    }

    for (const item of orderData.items) {
      if (!item.id || !item.name || item.price <= 0 || item.quantity <= 0) {
        return { isValid: false, error: `Invalid item data for ${item.name}` };
      }
      if (!item.type || !['food', 'deal'].includes(item.type)) {
        return { isValid: false, error: `Invalid item type for ${item.name}` };
      }
    }

    return { isValid: true };
  }
}

// Command Pattern for Order Operations
export interface OrderCommand {
  execute(): Promise<{ success: boolean; orderId?: number; error?: string }>;
}

export class CreateOrderCommand implements OrderCommand {
  constructor(
    private orderData: OrderData,
    private strategy: UnifiedOrderStrategy = new UnifiedOrderStrategy()
  ) {}

  async execute(): Promise<{ success: boolean; orderId?: number; error?: string }> {
    try {
      // Validate order
      const validation = this.strategy.validateOrder(this.orderData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Calculate total
      const totalAmount = this.strategy.calculateTotal(this.orderData.items);

      // Import supabase client
      const { supabase } = await import('../supabase');

      // Create unified order (no order_type needed)
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: this.orderData.userId,
          restaurant_id: this.orderData.restaurantId,
          total_amount: totalAmount,
          status: 'pending',
          delivery_address: this.orderData.deliveryAddress,
          phone_number: this.orderData.phoneNumber,
          special_instructions: this.orderData.specialInstructions
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return { success: false, error: 'Failed to create order' };
      }

      const orderId = orderResult.id;

      // Insert all items into unified order_items table
      const orderItems = this.orderData.items.map(item => ({
        order_id: orderId,
        food_id: item.type === 'food' ? item.id : null,
        deal_id: item.type === 'deal' ? item.id : null,
        item_type: item.type,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Rollback: Delete the order
        await supabase.from('orders').delete().eq('id', orderId);
        return { success: false, error: 'Failed to create order items' };
      }

      // Add calories to tracker immediately when order is placed
      try {
        // Calculate total calories from all items in the order
        let totalCalories = 0;
        
        for (const item of this.orderData.items) {
          if (item.type === 'food') {
            // Get food calories
            const { data: foodData } = await supabase
              .from('food')
              .select('total_calories')
              .eq('id', item.id)
              .single();
            
            if (foodData && foodData.total_calories) {
              totalCalories += foodData.total_calories * item.quantity;
            }
          } else if (item.type === 'deal') {
            // Get deal calories
            const { data: dealData } = await supabase
              .from('deals')
              .select('total_calories')
              .eq('id', item.id)
              .single();
            
            if (dealData && dealData.total_calories) {
              totalCalories += dealData.total_calories * item.quantity;
            }
          }
        }
        
        // Add total calories to user's tracker
        if (totalCalories > 0) {
          // First, get the current user_calory record
          const { data: currentData } = await supabase
            .from('user_calory')
            .select('*')
            .eq('user_id', this.orderData.userId)
            .single();

          if (currentData) {
            // Update existing record by adding to current_calory
            const newCurrentCalory = (Number(currentData.current_calory) || 0) + totalCalories;
            
            await supabase
              .from('user_calory')
              .update({
                current_calory: newCurrentCalory
              })
              .eq('user_id', this.orderData.userId);
          } else {
            // Create new record if it doesn't exist
            await supabase
              .from('user_calory')
              .insert({
                user_id: this.orderData.userId,
                current_calory: totalCalories,
                limit_calory: 2000,
                breakfast: 0,
                lunch: 0,
                dinner: 0
              });
          }
        }
      } catch (calorieError) {
        console.error('Error adding calories to tracker:', calorieError);
        // Don't fail the order creation if calorie tracking fails
      }

      return { success: true, orderId };
    } catch (error) {
      console.error('Error in CreateOrderCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
  }
}

export class UpdateOrderStatusCommand implements OrderCommand {
  constructor(
    private orderId: number,
    private newStatus: Order['status'],
    private restaurantId?: number
  ) {}

  async execute(): Promise<{ success: boolean; orderId?: number; error?: string }> {
    try {
      const { supabase } = await import('../supabase');

      // Update order status — restaurant ownership already verified via JWT auth
      const { error, count } = await supabase
        .from('orders')
        .update({ status: this.newStatus, updated_at: new Date().toISOString() })
        .eq('id', this.orderId)
        .select('id');

      if (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: 'Failed to update order status: ' + error.message };
      }

      return { success: true, orderId: this.orderId };
    } catch (error) {
      console.error('Error in UpdateOrderStatusCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
  }
}

// Repository Pattern for Order Data Access
export interface OrderRepository {
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: number): Promise<Order[]>;
  getOrderById(orderId: number): Promise<Order | null>;
  getOrderWithDetails(orderId: number): Promise<Order | null>;
}

export class SupabaseOrderRepository implements OrderRepository {
  async getOrdersByUser(userId: number): Promise<Order[]> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurant_user(name),
          order_items(
            id,
            food_id,
            deal_id,
            item_type,
            quantity,
            unit_price,
            total_price,
            food(name, image_url),
            deals(deal_name, description)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrdersByUser:', error);
      return [];
    }
  }

  async getOrdersByRestaurant(restaurantId: number): Promise<Order[]> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!inner(username, email),
          order_items(
            id,
            food_id,
            deal_id,
            item_type,
            quantity,
            unit_price,
            total_price,
            food(name, image_url),
            deals(deal_name, description)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurant orders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrdersByRestaurant:', error);
      return [];
    }
  }

  async getOrderById(orderId: number): Promise<Order | null> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderById:', error);
      return null;
    }
  }

  async getOrderWithDetails(orderId: number): Promise<Order | null> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!inner(username, email),
          restaurant_user(name),
          order_items(
            id,
            food_id,
            deal_id,
            item_type,
            quantity,
            unit_price,
            total_price,
            food(name, image_url, description),
            deals(deal_name, description, original_price)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order with details:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderWithDetails:', error);
      return null;
    }
  }
}

// Observer Pattern for Order Status Updates
export interface OrderObserver {
  onOrderStatusChanged(order: Order): void;
}

export class OrderNotificationService implements OrderObserver {
  onOrderStatusChanged(order: Order): void {
    console.log(`Order ${order.id} status changed to: ${order.status}`);
    // Here you could implement email notifications, push notifications, etc.
  }
}

// Service Layer for Order Management
export class OrderService {
  private repository: OrderRepository;
  private observers: OrderObserver[] = [];

  constructor(repository?: OrderRepository) {
    this.repository = repository || new SupabaseOrderRepository();
  }

  addObserver(observer: OrderObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: OrderObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notifyObservers(order: Order): void {
    this.observers.forEach(observer => observer.onOrderStatusChanged(order));
  }

  async createOrder(orderData: OrderData): Promise<{ success: boolean; orderId?: number; error?: string }> {
    const command = new CreateOrderCommand(orderData);
    return await command.execute();
  }

  async updateOrderStatus(orderId: number, newStatus: Order['status'], restaurantId?: number): Promise<{ success: boolean; error?: string }> {
    const command = new UpdateOrderStatusCommand(orderId, newStatus, restaurantId);
    const result = await command.execute();

    if (result.success) {
      // Notify observers
      const order = await this.repository.getOrderById(orderId);
      if (order) {
        this.notifyObservers(order);
      }
    }

    return result;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await this.repository.getOrdersByUser(userId);
  }

  async getRestaurantOrders(restaurantId: number): Promise<Order[]> {
    return await this.repository.getOrdersByRestaurant(restaurantId);
  }

  async getOrderDetails(orderId: number): Promise<Order | null> {
    return await this.repository.getOrderWithDetails(orderId);
  }
}

// Factory for creating order service
export class OrderServiceFactory {
  static createService(): OrderService {
    const repository = new SupabaseOrderRepository();
    const service = new OrderService(repository);
    
    // Add default observers
    const notificationService = new OrderNotificationService();
    service.addObserver(notificationService);
    
    return service;
  }
}