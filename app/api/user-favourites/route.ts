import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET /api/user-favourites?userId=X  — fetch all favourited deals for a user
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_favourites')
    .select(`
      id,
      deal_id,
      created_at,
      deals (
        id,
        deal_name,
        description,
        original_price,
        deal_price,
        current_uses,
        total_calories,
        created_at,
        restaurant_id,
        restaurant_user (
          id,
          name,
          profile_pic
        ),
        deal_items (
          quantity,
          food (
            name
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const favourites = (data || []).map((row: any) => {
    const deal = row.deals;
    if (!deal) return null;
    const orig = parseFloat(deal.original_price);
    const price = parseFloat(deal.deal_price);
    const savings = orig - price;
    return {
      id: deal.id,
      deal_name: deal.deal_name,
      description: deal.description || '',
      original_price: orig,
      deal_price: price,
      current_uses: deal.current_uses || 0,
      total_calories: deal.total_calories || 0,
      created_at: deal.created_at,
      savings: Math.max(0, savings),
      savingsPercentage: orig > 0 ? Math.round((savings / orig) * 100) : 0,
      restaurant: deal.restaurant_user
        ? { id: deal.restaurant_user.id, name: deal.restaurant_user.name, profile_pic: deal.restaurant_user.profile_pic }
        : { id: deal.restaurant_id, name: 'Restaurant', profile_pic: null },
      items: (deal.deal_items || []).map((di: any) => ({
        food_name: di.food?.name || 'Item',
        quantity: di.quantity,
      })),
    };
  }).filter(Boolean);

  return NextResponse.json({ success: true, favourites });
}

// POST /api/user-favourites  — add a favourite
export async function POST(request: NextRequest) {
  const { userId, dealId } = await request.json();
  if (!userId || !dealId) return NextResponse.json({ success: false, error: 'userId and dealId required' }, { status: 400 });

  const { error } = await supabase
    .from('user_favourites')
    .upsert({ user_id: userId, deal_id: dealId }, { onConflict: 'user_id,deal_id' });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/user-favourites?userId=X&dealId=Y  — remove a favourite
export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const dealId = request.nextUrl.searchParams.get('dealId');
  if (!userId || !dealId) return NextResponse.json({ success: false, error: 'userId and dealId required' }, { status: 400 });

  const { error } = await supabase
    .from('user_favourites')
    .delete()
    .eq('user_id', userId)
    .eq('deal_id', dealId);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
