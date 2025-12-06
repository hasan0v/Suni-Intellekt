import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Fetch a setting (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('key', key)
      .single()

    if (error) {
      // Return default value if not found
      if (error.code === 'PGRST116') {
        return NextResponse.json({ key, value: null })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    )
  }
}

// PUT - Update a setting (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for updates
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating setting:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
