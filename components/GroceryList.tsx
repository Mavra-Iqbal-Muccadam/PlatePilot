'use client';

import { useState, useEffect, useRef } from 'react';
import { FaBasketShopping } from 'react-icons/fa6';

// Observer Pattern for grocery list state management
interface GroceryListObserver {
  update(state: GroceryListState): void;
}

interface GroceryListState {
  isOpen: boolean;
  groceryList: GroceryListData | null;
  loading: boolean;
  error: string | null;
  addingCustomItem: boolean;
  fetchingPrices: boolean;
  generatingPDF: boolean;
  budgetSummary: BudgetSummary | null;
}

interface GroceryListData {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  grocery_items: GroceryItemData[];
}

interface GroceryItemData {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  source_food_id?: number;
  source_food_name?: string;
  is_custom: boolean;
  created_at: string;
  estimated_price?: number;
  price_fetched_at?: string;
}

interface BudgetSummary {
  totalItems: number;
  totalCost: number;
  purchasedCost: number;
  remainingCost: number;
  categoryBreakdown: { [category: string]: number };
  averageItemCost: number;
}

class GroceryListStateManager {
  private observers: GroceryListObserver[] = [];
  private state: GroceryListState = {
    isOpen: false,
    groceryList: null,
    loading: false,
    error: null,
    addingCustomItem: false,
    fetchingPrices: false,
    generatingPDF: false,
    budgetSummary: null
  };

  subscribe(observer: GroceryListObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: GroceryListObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notify(): void {
    this.observers.forEach(observer => observer.update(this.state));
  }

  updateState(newState: Partial<GroceryListState>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  resetState(): void {
    this.state = {
      isOpen: this.state.isOpen,
      groceryList: null,
      loading: false,
      error: null,
      addingCustomItem: false,
      fetchingPrices: false,
      generatingPDF: false,
      budgetSummary: null
    };
    this.notify();
  }

  getState(): GroceryListState {
    return { ...this.state };
  }
}

// Strategy Pattern for item grouping
interface ItemGroupingStrategy {
  groupItems(items: GroceryItemData[]): { [key: string]: GroceryItemData[] };
}

class CategoryGroupingStrategy implements ItemGroupingStrategy {
  private categories = {
    'Vegetables': ['onion', 'tomato', 'potato', 'carrot', 'lettuce', 'spinach', 'bell pepper', 'garlic', 'ginger'],
    'Fruits': ['apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'grapes'],
    'Meat & Poultry': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna'],
    'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs'],
    'Grains & Bread': ['rice', 'bread', 'flour', 'pasta', 'noodles', 'oats', 'quinoa'],
    'Spices & Herbs': ['salt', 'pepper', 'cumin', 'turmeric', 'coriander', 'basil', 'oregano', 'thyme'],
    'Pantry': ['oil', 'vinegar', 'sugar', 'honey', 'soy sauce', 'ketchup', 'mustard']
  };

  groupItems(items: GroceryItemData[]): { [key: string]: GroceryItemData[] } {
    const grouped: { [key: string]: GroceryItemData[] } = {};
    
    items.forEach(item => {
      const category = this.categorizeItem(item.ingredient_name);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }

  private categorizeItem(ingredientName: string): string {
    const lowerName = ingredientName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }
}

class StatusGroupingStrategy implements ItemGroupingStrategy {
  groupItems(items: GroceryItemData[]): { [key: string]: GroceryItemData[] } {
    return {
      'To Buy': items.filter(item => !item.is_purchased),
      'Purchased': items.filter(item => item.is_purchased)
    };
  }
}

class SourceGroupingStrategy implements ItemGroupingStrategy {
  groupItems(items: GroceryItemData[]): { [key: string]: GroceryItemData[] } {
    const grouped: { [key: string]: GroceryItemData[] } = {};
    
    items.forEach(item => {
      const source = item.source_food_name || (item.is_custom ? 'Custom Items' : 'Other');
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(item);
    });

    return grouped;
  }
}

interface GroceryListProps {
  userId: number;
  onAddToGrocery?: (success: boolean, message: string) => void;
  inline?: boolean; // when true, renders content directly on the page (no slide-in panel)
}

export default function GroceryList({ userId, onAddToGrocery, inline = false }: GroceryListProps) {
  const [listState, setListState] = useState<GroceryListState>({
    isOpen: false,
    groceryList: null,
    loading: false,
    error: null,
    addingCustomItem: false,
    fetchingPrices: false,
    generatingPDF: false,
    budgetSummary: null
  });

  const [customItem, setCustomItem] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: 'piece'
  });

  const [groupingStrategy, setGroupingStrategy] = useState<ItemGroupingStrategy>(new CategoryGroupingStrategy());
  const [groupBy, setGroupBy] = useState<'category' | 'status' | 'source'>('category');

  const stateManagerRef = useRef<GroceryListStateManager>(new GroceryListStateManager());

  useEffect(() => {
    const stateManager = stateManagerRef.current;
    
    const observer: GroceryListObserver = {
      update: (state: GroceryListState) => {
        setListState(state);
      }
    };

    stateManager.subscribe(observer);

    return () => {
      stateManager.unsubscribe(observer);
    };
  }, []);

  const handleToggleList = () => {
    const stateManager = stateManagerRef.current;
    const currentState = stateManager.getState();
    
    if (!currentState.isOpen) {
      stateManager.updateState({ isOpen: true });
      fetchGroceryList();
    } else {
      stateManager.updateState({ isOpen: false });
    }
  };

  const fetchGroceryList = async () => {
    const stateManager = stateManagerRef.current;
    
    try {
      stateManager.updateState({ loading: true, error: null });

      const response = await fetch(`/api/grocery?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        stateManager.updateState({
          groceryList: result.groceryList,
          loading: false
        });
      } else {
        stateManager.updateState({
          error: result.error || 'Failed to fetch grocery list',
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching grocery list:', error);
      stateManager.updateState({
        error: 'Network error occurred',
        loading: false
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/grocery/items?item_id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        fetchGroceryList();
        if (onAddToGrocery) {
          onAddToGrocery(true, 'Item removed from grocery list');
        }
      } else {
        if (onAddToGrocery) {
          onAddToGrocery(false, result.error || 'Failed to remove item');
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
      if (onAddToGrocery) {
        onAddToGrocery(false, 'Network error occurred');
      }
    }
  };

  const handleTogglePurchased = async (itemId: number, isPurchased: boolean) => {
    try {
      const response = await fetch('/api/grocery/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          is_purchased: !isPurchased
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchGroceryList();
      }
    } catch (error) {
      console.error('Error toggling purchased status:', error);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    try {
      const response = await fetch('/api/grocery/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          quantity: newQuantity
        })
      });

      const result = await response.json();

      if (result.success) {
        fetchGroceryList();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleAddCustomItem = async () => {
    if (!customItem.ingredient_name.trim()) return;

    const stateManager = stateManagerRef.current;
    
    try {
      stateManager.updateState({ addingCustomItem: true });

      const response = await fetch('/api/grocery/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          ...customItem
        })
      });

      const result = await response.json();

      if (result.success) {
        setCustomItem({ ingredient_name: '', quantity: 1, unit: 'piece' });
        fetchGroceryList();
        if (onAddToGrocery) {
          onAddToGrocery(true, result.message);
        }
      } else {
        if (onAddToGrocery) {
          onAddToGrocery(false, result.error || 'Failed to add custom item');
        }
      }
    } catch (error) {
      console.error('Error adding custom item:', error);
      if (onAddToGrocery) {
        onAddToGrocery(false, 'Network error occurred');
      }
    } finally {
      stateManager.updateState({ addingCustomItem: false });
    }
  };

  const handleClearPurchased = async () => {
    try {
      const response = await fetch(`/api/grocery/clear-purchased?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        fetchGroceryList();
        if (onAddToGrocery) {
          onAddToGrocery(true, 'Purchased items cleared');
        }
      } else {
        if (onAddToGrocery) {
          onAddToGrocery(false, result.error || 'Failed to clear purchased items');
        }
      }
    } catch (error) {
      console.error('Error clearing purchased items:', error);
      if (onAddToGrocery) {
        onAddToGrocery(false, 'Network error occurred');
      }
    }
  };

  const handleFetchPrices = async () => {
    const stateManager = stateManagerRef.current;
    
    try {
      stateManager.updateState({ fetchingPrices: true, error: null });

      const response = await fetch('/api/budget/fetch-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();

      if (result.success) {
        stateManager.updateState({
          budgetSummary: result.budgetSummary,
          fetchingPrices: false
        });
        
        fetchGroceryList();
        
        if (onAddToGrocery) {
          onAddToGrocery(true, 'Prices fetched and budget calculated!');
        }
      } else {
        stateManager.updateState({
          error: result.error || 'Failed to fetch prices',
          fetchingPrices: false
        });
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      stateManager.updateState({
        error: 'Network error occurred while fetching prices',
        fetchingPrices: false
      });
    }
  };

  const handleGeneratePDF = async () => {
    const stateManager = stateManagerRef.current;
    
    try {
      stateManager.updateState({ generatingPDF: true, error: null });

      const userData = localStorage.getItem('userData');
      const userName = userData ? JSON.parse(userData).username : 'User';

      const response = await fetch('/api/budget/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          user_id: userId,
          user_name: userName
        })
      });

      const result = await response.json();

      if (result.success) {
        generateAndDownloadPDF(result.pdfData, result.filename);
        
        stateManager.resetState();
        
        setTimeout(() => {
          fetchGroceryList();
        }, 1000);
        
        if (onAddToGrocery) {
          onAddToGrocery(true, 'Budget PDF downloaded and grocery list cleared!');
        }
      } else {
        stateManager.updateState({
          error: result.error || 'Failed to generate PDF',
          generatingPDF: false
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      stateManager.updateState({
        error: 'Network error occurred while generating PDF',
        generatingPDF: false
      });
    }
  };

  const generateAndDownloadPDF = (pdfData: any, filename: string) => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const margin = 18;
      const contentW = W - margin * 2;
      const summary = pdfData.budgetSummary;

      const hex2rgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };
      const setFill   = (hex: string) => doc.setFillColor(...hex2rgb(hex));
      const setStroke = (hex: string) => doc.setDrawColor(...hex2rgb(hex));
      const setColor  = (hex: string) => doc.setTextColor(...hex2rgb(hex));

      // Header band
      setFill('#1D2D00');
      doc.rect(0, 0, W, 38, 'F');
      setFill('#90CD1D');
      doc.rect(0, 38, W, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      setColor('#90CD1D');
      doc.text('PlatePilot', margin, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setColor('#D6F0A4');
      doc.text('Eat Smart, Live Better', margin, 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      setColor('#ffffff');
      doc.text('GROCERY BUDGET PLAN', W - margin, 18, { align: 'right' });

      // Meta row
      let y = 50;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setColor('#386641');
      doc.text(`Prepared for: ${pdfData.userName}`, margin, y);
      doc.text(`Date: ${pdfData.date}`, W - margin, y, { align: 'right' });

      y += 5;
      setStroke('#C8DFA0');
      doc.setLineWidth(0.3);
      doc.line(margin, y, W - margin, y);

      // Budget summary cards
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setColor('#1D2D00');
      doc.text('BUDGET SUMMARY', margin, y);

      y += 6;
      const cardW = (contentW - 9) / 4;
      const cardH = 20;
      const cards = [
        { label: 'Total Items', value: String(summary.totalItems),     bg: '#F0F4E8', accent: '#386641' },
        { label: 'Total Cost',  value: `PKR ${summary.totalCost}`,     bg: '#E8F0D7', accent: '#1D2D00' },
        { label: 'Purchased',   value: `PKR ${summary.purchasedCost}`, bg: '#F0F4E8', accent: '#386641' },
        { label: 'Remaining',   value: `PKR ${summary.remainingCost}`, bg: '#E8F0D7', accent: '#1D2D00' },
      ];

      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 3);
        setFill(card.bg);
        setStroke('#C8DFA0');
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');
        setFill(card.accent);
        doc.roundedRect(cx, y, cardW, 2.5, 1, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        setColor('#386641');
        doc.text(card.label.toUpperCase(), cx + cardW / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        setColor('#1D2D00');
        doc.text(card.value, cx + cardW / 2, y + 15, { align: 'center' });
      });

      // Items table
      y += cardH + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setColor('#1D2D00');
      doc.text('GROCERY ITEMS', margin, y);

      y += 5;
      setFill('#1D2D00');
      doc.rect(margin, y, contentW, 8, 'F');

      const cols = {
        item:   { x: margin + 3  },
        source: { x: margin + 75 },
        qty:    { x: margin + 117 },
        status: { x: margin + 137 },
        price:  { x: margin + 161 },
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setColor('#D6F0A4');
      doc.text('ITEM',   cols.item.x,   y + 5.5);
      doc.text('SOURCE', cols.source.x, y + 5.5);
      doc.text('QTY',    cols.qty.x,    y + 5.5);
      doc.text('STATUS', cols.status.x, y + 5.5);
      doc.text('PRICE',  cols.price.x,  y + 5.5);

      y += 8;
      const rowH = 7.5;

      pdfData.items.forEach((item: any, idx: number) => {
        if (y + rowH > 272) {
          doc.addPage();
          y = 20;
          setFill('#1D2D00');
          doc.rect(margin, y, contentW, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          setColor('#D6F0A4');
          doc.text('ITEM',   cols.item.x,   y + 5.5);
          doc.text('SOURCE', cols.source.x, y + 5.5);
          doc.text('QTY',    cols.qty.x,    y + 5.5);
          doc.text('STATUS', cols.status.x, y + 5.5);
          doc.text('PRICE',  cols.price.x,  y + 5.5);
          y += 8;
        }

        if (idx % 2 === 0) {
          setFill('#F8FAF4');
          doc.rect(margin, y, contentW, rowH, 'F');
        }

        if (item.is_purchased) {
          setFill('#90CD1D');
          doc.rect(margin, y, 1.5, rowH, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setColor(item.is_purchased ? '#6A994E' : '#1D2D00');

        const name = item.ingredient_name.length > 32
          ? item.ingredient_name.substring(0, 30) + '\u2026'
          : item.ingredient_name;
        doc.text(name, cols.item.x, y + 5);

        const src = item.source_food_name || (item.is_custom ? 'Custom' : '\u2014');
        const srcTrunc = src.length > 18 ? src.substring(0, 16) + '\u2026' : src;
        doc.setFontSize(7);
        setColor('#6A994E');
        doc.text(srcTrunc, cols.source.x, y + 5);

        doc.setFontSize(8);
        setColor('#1D2D00');
        doc.text(`${item.quantity} ${item.unit}`, cols.qty.x, y + 5);

        if (item.is_purchased) {
          setFill('#E8F0D7');
          doc.roundedRect(cols.status.x - 1, y + 1.5, 20, 4.5, 1, 1, 'F');
          doc.setFontSize(6.5);
          setColor('#386641');
          doc.text('\u2713 Purchased', cols.status.x + 9, y + 4.8, { align: 'center' });
        } else {
          setFill('#FFF9F0');
          doc.roundedRect(cols.status.x - 1, y + 1.5, 16, 4.5, 1, 1, 'F');
          doc.setFontSize(6.5);
          setColor('#C07A2F');
          doc.text('To Buy', cols.status.x + 7, y + 4.8, { align: 'center' });
        }

        doc.setFontSize(8);
        setColor('#1D2D00');
        doc.setFont('helvetica', 'bold');
        const price = item.estimated_price ? `PKR ${item.estimated_price}` : '\u2014';
        doc.text(price, cols.price.x + 10, y + 5, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        setStroke('#E8F0D7');
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);

        y += rowH;
      });

      // Total row
      y += 2;
      setFill('#1D2D00');
      doc.rect(margin, y, contentW, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor('#D6F0A4');
      doc.text('TOTAL', margin + 3, y + 6);
      setColor('#90CD1D');
      doc.text(`PKR ${summary.totalCost}`, W - margin - 3, y + 6, { align: 'right' });

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        setFill('#F0F4E8');
        doc.rect(0, 284, W, 13, 'F');
        setStroke('#C8DFA0');
        doc.setLineWidth(0.3);
        doc.line(0, 284, W, 284);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        setColor('#386641');
        doc.text('PlatePilot \u2014 Eat Smart, Live Better', margin, 290);
        doc.text(`Page ${p} of ${totalPages}`, W - margin, 290, { align: 'right' });
        doc.text('platepilot.app', W / 2, 290, { align: 'center' });
      }

      doc.save(filename);
    }).catch((error: unknown) => {
      console.error('Error generating PDF:', error);
      const content = [
        'PlatePilot - Grocery Budget Plan',
        '=================================',
        `Date: ${pdfData.date}`,
        `Prepared for: ${pdfData.userName}`,
        '',
        'BUDGET SUMMARY',
        '--------------',
        `Total Items:  ${pdfData.budgetSummary.totalItems}`,
        `Total Cost:   PKR ${pdfData.budgetSummary.totalCost}`,
        `Purchased:    PKR ${pdfData.budgetSummary.purchasedCost}`,
        `Remaining:    PKR ${pdfData.budgetSummary.remainingCost}`,
        '',
        'GROCERY ITEMS',
        '-------------',
        ...pdfData.items.map((item: any) =>
          `${item.ingredient_name.padEnd(32)} ${String(item.quantity).padStart(4)} ${item.unit.padEnd(8)} ${item.is_purchased ? '[Purchased]' : '[To Buy]  '} PKR ${item.estimated_price || 0}`
        ),
      ].join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  const calculateLocalBudget = (): BudgetSummary | null => {
    if (!listState.groceryList?.grocery_items || listState.groceryList.grocery_items.length === 0) {
      return null;
    }

    const items = listState.groceryList.grocery_items;
    const totalItems = items.length;
    const totalCost = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const purchasedCost = items
      .filter(item => item.is_purchased)
      .reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const remainingCost = totalCost - purchasedCost;
    const averageItemCost = totalItems > 0 ? totalCost / totalItems : 0;

    if (totalItems === 0) {
      return null;
    }

    return {
      totalItems,
      totalCost: Math.round(totalCost * 100) / 100,
      purchasedCost: Math.round(purchasedCost * 100) / 100,
      remainingCost: Math.round(remainingCost * 100) / 100,
      categoryBreakdown: {},
      averageItemCost: Math.round(averageItemCost * 100) / 100
    };
  };

  const handleGroupingChange = (newGroupBy: 'category' | 'status' | 'source') => {
    setGroupBy(newGroupBy);
    
    switch (newGroupBy) {
      case 'category':
        setGroupingStrategy(new CategoryGroupingStrategy());
        break;
      case 'status':
        setGroupingStrategy(new StatusGroupingStrategy());
        break;
      case 'source':
        setGroupingStrategy(new SourceGroupingStrategy());
        break;
    }
  };

  const renderGroceryItems = () => {
    if (!listState.groceryList || !listState.groceryList.grocery_items) {
      return null;
    }

    const groupedItems = groupingStrategy.groupItems(listState.groceryList.grocery_items);
    
    return Object.entries(groupedItems).map(([groupName, items]) => (
      <div key={groupName} className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📂</span>
          {groupName} ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-3 transition-all ${
                item.is_purchased 
                  ? 'bg-green-50 border-green-200 opacity-75' 
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => handleTogglePurchased(item.id, item.is_purchased)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      item.is_purchased
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {item.is_purchased && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${item.is_purchased ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {item.ingredient_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {item.source_food_name && (
                        <span>From: {item.source_food_name}</span>
                      )}
                      {item.is_custom && (
                        <span className="text-blue-600">Custom item</span>
                      )}
                      {item.estimated_price !== undefined && (
                        <span className="text-green-600 font-semibold">
                          PKR {item.estimated_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-sm font-medium min-w-[3rem] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  // ── Shared body content ──────────────────────────────────────────────────
  const groceryBody = (
    <div>
      {listState.loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#90CD1D] border-t-transparent" />
        </div>
      ) : listState.error ? (
        <div className="p-6 text-center">
          <p className="mb-4 text-sm text-red-600">{listState.error}</p>
          <button onClick={fetchGroceryList}
            className="rounded-xl bg-[#1D2D00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#386641]">
            Try Again
          </button>
        </div>
      ) : inline ? (
        /* ── INLINE (full page) — two-column layout ── */
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#1D2D00]/50">Group by:</span>
                <select value={groupBy}
                  onChange={e => handleGroupingChange(e.target.value as 'category' | 'status' | 'source')}
                  className="rounded-lg border border-[#C8DFA0] bg-white px-2 py-1 text-xs text-[#1D2D00] outline-none focus:border-[#90CD1D]">
                  <option value="category">Category</option>
                  <option value="status">Status</option>
                  <option value="source">Source</option>
                </select>
              </div>
              {listState.groceryList?.grocery_items?.some(i => i.is_purchased) && (
                <button onClick={handleClearPurchased}
                  className="rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] px-3 py-1 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                  Clear Purchased
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Add Custom Item</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Item name" value={customItem.ingredient_name}
                  onChange={e => setCustomItem(p => ({ ...p, ingredient_name: e.target.value }))}
                  className="flex-1 rounded-xl border border-[#C8DFA0] px-3 py-2 text-sm text-[#1D2D00] outline-none focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20" />
                <input type="number" placeholder="Qty" value={customItem.quantity} min="1"
                  onChange={e => setCustomItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))}
                  className="w-14 rounded-xl border border-[#C8DFA0] px-2 py-2 text-sm text-[#1D2D00] outline-none focus:border-[#90CD1D]" />
                <button onClick={handleAddCustomItem}
                  disabled={!customItem.ingredient_name.trim() || listState.addingCustomItem}
                  className="rounded-xl bg-[#1D2D00] px-3 py-2 text-sm font-bold text-white hover:bg-[#386641] disabled:opacity-40">
                  {listState.addingCustomItem ? '…' : '+'}
                </button>
              </div>
            </div>

            {(listState.groceryList?.grocery_items?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-[#E8F0D7] bg-white p-10 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7] text-2xl">🛒</div>
                <p className="font-bold text-[#1D2D00]">List is empty</p>
                <p className="mt-1 text-xs text-[#1D2D00]/50">Add ingredients from food items or create custom items above.</p>
              </div>
            ) : renderGroceryItems()}
          </div>

          {/* Right: budget + actions */}
          <div className="space-y-4">
            {(() => {
              const budget = listState.budgetSummary || calculateLocalBudget();
              return budget && budget.totalItems > 0 ? (
                <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Budget Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Items',  value: String(budget.totalItems) },
                      { label: 'Total Cost',   value: `PKR ${budget.totalCost}` },
                      { label: 'Purchased',    value: `PKR ${budget.purchasedCost}` },
                      { label: 'Remaining',    value: `PKR ${budget.remainingCost}` },
                      { label: 'Avg per Item', value: `PKR ${budget.averageItemCost}` },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between border-b border-[#E8F0D7] pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-[#1D2D00]/60">{s.label}</span>
                        <span className="text-sm font-bold text-[#1D2D00]">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Estimate Costs</p>
              <p className="mb-4 text-xs text-[#1D2D00]/50">Fetch live price estimates for all items in your list.</p>
              <button onClick={handleFetchPrices}
                disabled={listState.fetchingPrices || !listState.groceryList?.grocery_items?.length}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D2D00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#386641] disabled:opacity-40">
                {listState.fetchingPrices
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Fetching…</>
                  : <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" /></svg>Show Estimated Prices</>}
              </button>
            </div>

            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Export Budget Plan</p>
              <p className="mb-4 text-xs text-[#1D2D00]/50">Download a professional PDF with your full grocery budget breakdown.</p>
              <button onClick={handleGeneratePDF}
                disabled={listState.generatingPDF || !listState.groceryList?.grocery_items?.length}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] py-3 text-sm font-bold text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
                {listState.generatingPDF
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#386641] border-t-transparent" />Generating PDF…</>
                  : <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download PDF</>}
              </button>
              <p className="mt-2 text-center text-[10px] text-[#1D2D00]/30">List will be cleared after download</p>
            </div>

            <div className="rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">PDF includes</p>
              <ul className="space-y-2">
                {['PlatePilot branding & header','Budget summary (4 stat cards)','Full items table with status','Price per item & total','Page numbers & footer'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#1D2D00]/60">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#90CD1D]" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ── PANEL (slide-in) — compact single column ── */
        <div className="p-5 space-y-5">
          {(listState.budgetSummary || ((listState.groceryList?.grocery_items?.length ?? 0) > 0 && calculateLocalBudget())) && (() => {
            const budget = listState.budgetSummary || calculateLocalBudget();
            return budget && budget.totalItems > 0 ? (
              <div className="rounded-2xl border border-[#E8F0D7] bg-[#F8FAF4] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#386641]">Budget Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Total Items', value: String(budget.totalItems) },
                    { label: 'Total Cost',  value: `PKR ${budget.totalCost}` },
                    { label: 'Purchased',   value: `PKR ${budget.purchasedCost}` },
                    { label: 'Remaining',   value: `PKR ${budget.remainingCost}` },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-[#E8F0D7] bg-white p-3">
                      <p className="text-xs text-[#1D2D00]/50">{s.label}</p>
                      <p className="mt-0.5 font-bold text-[#1D2D00]">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleFetchPrices}
              disabled={listState.fetchingPrices || !listState.groceryList?.grocery_items?.length}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1D2D00] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#386641] disabled:opacity-40">
              {listState.fetchingPrices
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Fetching…</>
                : <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" /></svg>Show Estimated Prices</>}
            </button>
            <button onClick={handleGeneratePDF}
              disabled={listState.generatingPDF || !listState.groceryList?.grocery_items?.length}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#C8DFA0] bg-[#F0F4E8] py-2.5 text-xs font-semibold text-[#386641] transition-colors hover:bg-[#E8F0D7] disabled:opacity-40">
              {listState.generatingPDF
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#386641] border-t-transparent" />Generating…</>
                : <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download PDF</>}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#1D2D00]/50">Group:</span>
              <select value={groupBy}
                onChange={e => handleGroupingChange(e.target.value as 'category' | 'status' | 'source')}
                className="rounded-lg border border-[#C8DFA0] bg-white px-2 py-1 text-xs text-[#1D2D00] outline-none focus:border-[#90CD1D]">
                <option value="category">Category</option>
                <option value="status">Status</option>
                <option value="source">Source</option>
              </select>
            </div>
            {listState.groceryList?.grocery_items?.some(i => i.is_purchased) && (
              <button onClick={handleClearPurchased}
                className="rounded-lg border border-[#C8DFA0] bg-[#F0F4E8] px-3 py-1 text-xs font-semibold text-[#386641] hover:bg-[#E8F0D7]">
                Clear Purchased
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-[#E8F0D7] bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1D2D00]/50">Add Custom Item</p>
            <div className="flex gap-2">
              <input type="text" placeholder="Item name" value={customItem.ingredient_name}
                onChange={e => setCustomItem(p => ({ ...p, ingredient_name: e.target.value }))}
                className="flex-1 rounded-xl border border-[#C8DFA0] px-3 py-2 text-sm text-[#1D2D00] outline-none focus:border-[#90CD1D] focus:ring-2 focus:ring-[#90CD1D]/20" />
              <input type="number" placeholder="Qty" value={customItem.quantity} min="1"
                onChange={e => setCustomItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))}
                className="w-14 rounded-xl border border-[#C8DFA0] px-2 py-2 text-sm text-[#1D2D00] outline-none focus:border-[#90CD1D]" />
              <button onClick={handleAddCustomItem}
                disabled={!customItem.ingredient_name.trim() || listState.addingCustomItem}
                className="rounded-xl bg-[#1D2D00] px-3 py-2 text-sm font-bold text-white hover:bg-[#386641] disabled:opacity-40">
                {listState.addingCustomItem ? '…' : '+'}
              </button>
            </div>
          </div>

          {(listState.groceryList?.grocery_items?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-[#E8F0D7] bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0D7] text-2xl">🛒</div>
              <p className="font-bold text-[#1D2D00]">List is empty</p>
              <p className="mt-1 text-xs text-[#1D2D00]/50">Add ingredients from food items or create custom items above.</p>
            </div>
          ) : renderGroceryItems()}
        </div>
      )}
    </div>
  );

  // ── Inline mode — render directly on the page ────────────────────────────
  if (inline) {
    // Auto-open the list when inline
    if (!listState.isOpen && !listState.loading && !listState.groceryList) {
      handleToggleList();
    }
    return groceryBody;
  }

  return (
    <div>
      {/* Hidden trigger — called by FloatingMenu */}
      <button onClick={handleToggleList} className="sr-only" id="grocery-list-trigger">
        Grocery List
      </button>

      {/* Slide-in panel from right */}
      {listState.isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={handleToggleList} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#1D2D00] to-[#386641] px-5 py-4">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div>
                  <p className="font-bold leading-tight text-white">My Grocery List</p>
                  <p className="text-xs text-white/55">
                    {listState.groceryList ? `${listState.groceryList.grocery_items?.length || 0} items` : 'Loading…'}
                  </p>
                </div>
              </div>
              <button onClick={handleToggleList}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {groceryBody}
            </div>
          </div>
        </>
      )}
    </div>
  );
}