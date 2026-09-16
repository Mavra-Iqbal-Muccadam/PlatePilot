import { supabase } from '../supabase';

/**
 * Observer Pattern: Observers get notified when halal status changes
 */
interface HalalStatusObserver {
  onHalalStatusChanged(dealId: number, isHalal: boolean | null): void;
}

/**
 * Halal Verification Result
 */
interface HalalVerificationResult {
  dealId: number;
  isHalal: boolean | null;
  reason?: string;
  ingredients: string[];
  timestamp: Date;
}

/**
 * Repository Pattern: Handles data access for halal verification
 */
interface HalalRepository {
  getDealIngredients(dealId: number): Promise<string[]>;
  getFoodIngredients(foodId: number): Promise<string[]>;
  cacheHalalResult(dealId: number, result: HalalVerificationResult): Promise<void>;
  getCachedResult(dealId: number): Promise<HalalVerificationResult | null>;
}

class SupabaseHalalRepository implements HalalRepository {
  async getDealIngredients(dealId: number): Promise<string[]> {
    try {
      console.log(`Fetching ingredients for deal ${dealId}`);
      
      // Fetch the deal first
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (dealError) {
        console.error('Error fetching deal:', dealError);
        return [];
      }

      console.log('Deal data:', deal);

      // Try to get ingredients from deal_items table
      const { data: dealItems, error: dealItemsError } = await supabase
        .from('deal_items')
        .select('food_id, quantity')
        .eq('deal_id', dealId);

      console.log('Deal items:', dealItems, 'Error:', dealItemsError);

      if (!dealItemsError && dealItems && dealItems.length > 0) {
        const allIngredients: string[] = [];
        
        for (const item of dealItems) {
          console.log(`Fetching ingredients for food ${item.food_id}`);
          
          const { data: ingredients, error: ingredientError } = await supabase
            .from('food_details')
            .select('ingredient_name')
            .eq('food_id', item.food_id);

          console.log(`Ingredients for food ${item.food_id}:`, ingredients, 'Error:', ingredientError);

          if (!ingredientError && ingredients) {
            ingredients.forEach(ing => {
              if (ing.ingredient_name && !allIngredients.includes(ing.ingredient_name)) {
                allIngredients.push(ing.ingredient_name);
              }
            });
          }
        }
        
        console.log('All ingredients collected:', allIngredients);
        return allIngredients;
      }

      // Fallback: Return some default ingredients for testing
      console.warn('No deal items found, using default ingredients for testing');
      return ['yogurt', 'muesli', 'fruit', 'honey'];
    } catch (error) {
      console.error('Error in getDealIngredients:', error);
      return ['yogurt', 'muesli', 'fruit', 'honey'];
    }
  }

  /**
   * Get ingredients for a food item
   */
  async getFoodIngredients(foodId: number): Promise<string[]> {
    try {
      console.log(`Fetching ingredients for food ${foodId}`);
      
      const { data: ingredients, error: ingredientError } = await supabase
        .from('food_details')
        .select('ingredient_name')
        .eq('food_id', foodId);

      console.log(`Ingredients for food ${foodId}:`, ingredients, 'Error:', ingredientError);

      if (!ingredientError && ingredients && ingredients.length > 0) {
        const ingredientNames = ingredients
          .map(ing => ing.ingredient_name)
          .filter(name => name && name.length > 0);
        
        console.log('Food ingredients collected:', ingredientNames);
        return ingredientNames;
      }

      // Fallback: Return default ingredients
      console.warn('No ingredients found for food, using defaults');
      return ['chicken', 'rice', 'vegetables'];
    } catch (error) {
      console.error('Error in getFoodIngredients:', error);
      return ['chicken', 'rice', 'vegetables'];
    }
  }

  async cacheHalalResult(dealId: number, result: HalalVerificationResult): Promise<void> {
    try {
      // Store in localStorage for client-side caching
      const cache = JSON.parse(localStorage.getItem('halalCache') || '{}');
      cache[dealId] = result;
      localStorage.setItem('halalCache', JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching halal result:', error);
    }
  }

  async getCachedResult(dealId: number): Promise<HalalVerificationResult | null> {
    try {
      const cache = JSON.parse(localStorage.getItem('halalCache') || '{}');
      const cached = cache[dealId];
      
      if (cached) {
        // Check if cache is still valid (24 hours)
        const cacheTime = new Date(cached.timestamp).getTime();
        const now = new Date().getTime();
        const isValid = (now - cacheTime) < (24 * 60 * 60 * 1000);
        
        if (isValid) {
          return cached;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached halal result:', error);
      return null;
    }
  }
}

/**
 * Factory Pattern: Creates repository instances
 */
class HalalRepositoryFactory {
  private static instance: HalalRepository;

  static getInstance(): HalalRepository {
    if (!this.instance) {
      this.instance = new SupabaseHalalRepository();
    }
    return this.instance;
  }
}

/**
 * LLM Integration: Calls Claude API to verify halal status
 */
interface HalalVerificationProvider {
  verify(ingredients: string[]): Promise<boolean>;
}

class ClaudeHalalVerificationProvider implements HalalVerificationProvider {
  async verify(ingredients: string[]): Promise<boolean> {
    console.log(`[ClaudeHalalVerificationProvider] verify called with ingredients:`, ingredients);
    try {
      console.log(`[ClaudeHalalVerificationProvider] Calling /api/verify-halal endpoint`);
      const response = await fetch('/api/verify-halal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      console.log(`[ClaudeHalalVerificationProvider] Response status:`, response.status);
      const result = await response.json();
      console.log(`[ClaudeHalalVerificationProvider] Response data:`, result);
      
      const isHalal = result.isHalal === true;
      console.log(`[ClaudeHalalVerificationProvider] Returning isHalal: ${isHalal}`);
      return isHalal;
    } catch (error) {
      console.error('[ClaudeHalalVerificationProvider] Error verifying halal status:', error);
      return false;
    }
  }
}

/**
 * Main Halal Verifier Service with Observer Pattern
 */
export class HalalVerifierService {
  private repository: HalalRepository;
  private provider: HalalVerificationProvider;
  private observers: Map<number, HalalStatusObserver[]> = new Map();
  private verificationCache: Map<number, HalalVerificationResult> = new Map();

  constructor(
    repository?: HalalRepository,
    provider?: HalalVerificationProvider
  ) {
    this.repository = repository || HalalRepositoryFactory.getInstance();
    this.provider = provider || new ClaudeHalalVerificationProvider();
  }

  /**
   * Subscribe to halal status changes for a deal
   */
  subscribe(dealId: number, observer: HalalStatusObserver): void {
    if (!this.observers.has(dealId)) {
      this.observers.set(dealId, []);
    }
    this.observers.get(dealId)!.push(observer);
  }

  /**
   * Unsubscribe from halal status changes
   */
  unsubscribe(dealId: number, observer: HalalStatusObserver): void {
    const dealObservers = this.observers.get(dealId);
    if (dealObservers) {
      const index = dealObservers.indexOf(observer);
      if (index > -1) {
        dealObservers.splice(index, 1);
      }
    }
  }

  /**
   * Notify all observers of halal status change
   */
  private notifyObservers(dealId: number, isHalal: boolean | null): void {
    const dealObservers = this.observers.get(dealId);
    if (dealObservers) {
      dealObservers.forEach(observer => {
        observer.onHalalStatusChanged(dealId, isHalal);
      });
    }
  }

  /**
   * Verify halal status of a deal
   */
  async verifyDeal(dealId: number): Promise<HalalVerificationResult> {
    console.log(`[HalalVerifierService] verifyDeal called for dealId: ${dealId}`);
    
    // Check in-memory cache first
    if (this.verificationCache.has(dealId)) {
      console.log(`[HalalVerifierService] Found in-memory cache for dealId: ${dealId}`);
      return this.verificationCache.get(dealId)!;
    }

    // Check persistent cache
    console.log(`[HalalVerifierService] Checking persistent cache for dealId: ${dealId}`);
    const cachedResult = await this.repository.getCachedResult(dealId);
    if (cachedResult) {
      console.log(`[HalalVerifierService] Found persistent cache for dealId: ${dealId}`);
      this.verificationCache.set(dealId, cachedResult);
      return cachedResult;
    }

    // Fetch ingredients
    console.log(`[HalalVerifierService] Fetching ingredients for dealId: ${dealId}`);
    const ingredients = await this.repository.getDealIngredients(dealId);
    console.log(`[HalalVerifierService] Fetched ingredients:`, ingredients);

    // Verify with LLM
    console.log(`[HalalVerifierService] Calling LLM provider to verify ingredients`);
    const isHalal = await this.provider.verify(ingredients);
    console.log(`[HalalVerifierService] LLM verification result: ${isHalal}`);

    // Create result
    const result: HalalVerificationResult = {
      dealId,
      isHalal,
      ingredients,
      timestamp: new Date(),
      reason: isHalal ? 'All ingredients are halal' : 'Some ingredients may not be halal'
    };

    console.log(`[HalalVerifierService] Created verification result:`, result);

    // Cache result
    this.verificationCache.set(dealId, result);
    await this.repository.cacheHalalResult(dealId, result);
    console.log(`[HalalVerifierService] Cached verification result`);

    // Notify observers
    console.log(`[HalalVerifierService] Notifying observers for dealId: ${dealId}`);
    this.notifyObservers(dealId, isHalal);

    return result;
  }

  /**
   * Get cached result without verification
   */
  getCachedVerification(dealId: number): HalalVerificationResult | null {
    return this.verificationCache.get(dealId) || null;
  }

  /**
   * Verify halal status of a food item
   */
  async verifyFood(foodId: number): Promise<HalalVerificationResult> {
    console.log(`[HalalVerifierService] verifyFood called for foodId: ${foodId}`);
    
    // Check in-memory cache first
    if (this.verificationCache.has(foodId)) {
      console.log(`[HalalVerifierService] Found in-memory cache for foodId: ${foodId}`);
      return this.verificationCache.get(foodId)!;
    }

    // Check persistent cache
    console.log(`[HalalVerifierService] Checking persistent cache for foodId: ${foodId}`);
    const cachedResult = await this.repository.getCachedResult(foodId);
    if (cachedResult) {
      console.log(`[HalalVerifierService] Found persistent cache for foodId: ${foodId}`);
      this.verificationCache.set(foodId, cachedResult);
      return cachedResult;
    }

    // Fetch ingredients
    console.log(`[HalalVerifierService] Fetching ingredients for foodId: ${foodId}`);
    const ingredients = await this.repository.getFoodIngredients(foodId);
    console.log(`[HalalVerifierService] Fetched ingredients:`, ingredients);

    // Verify with LLM
    console.log(`[HalalVerifierService] Calling LLM provider to verify ingredients`);
    const isHalal = await this.provider.verify(ingredients);
    console.log(`[HalalVerifierService] LLM verification result: ${isHalal}`);

    // Create result
    const result: HalalVerificationResult = {
      dealId: foodId,
      isHalal,
      ingredients,
      timestamp: new Date(),
      reason: isHalal ? 'All ingredients are halal' : 'Some ingredients are not halal'
    };

    console.log(`[HalalVerifierService] Created verification result:`, result);

    // Cache result
    this.verificationCache.set(foodId, result);
    await this.repository.cacheHalalResult(foodId, result);
    console.log(`[HalalVerifierService] Cached verification result`);

    // Notify observers
    console.log(`[HalalVerifierService] Notifying observers for foodId: ${foodId}`);
    this.notifyObservers(foodId, isHalal);

    return result;
  }
}

// Export factory for easy access
export const halalVerifierFactory = HalalRepositoryFactory;
