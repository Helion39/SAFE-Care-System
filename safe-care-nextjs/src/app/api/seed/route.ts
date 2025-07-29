import { NextResponse } from 'next/server';
import { seedDatabase } from '@/utils/seedDatabase';

export async function POST() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedDatabase();
    console.log('✅ Database seeding completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error) {
    console.error('❌ Seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}