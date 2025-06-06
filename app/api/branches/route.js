import { NextResponse } from 'next/server';
import { getBaseHeaders } from '@/app/utils/api';

export async function GET() {
  try {
    // Use the branches API URL from environment variables
    const branchesApiUrl = process.env.BRANCHES_API || process.env.NEXT_PUBLIC_BRANCHES_API;
    
    if (!branchesApiUrl) {
      console.error('BRANCHES_API environment variable is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }
    
    // Make the actual API call
    const response = await fetch(branchesApiUrl, {
      method: 'GET',
      headers: getBaseHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch branches:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch branches: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Branches API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Use the branches API URL from environment variables
    const branchesApiUrl = process.env.BRANCHES_API || process.env.NEXT_PUBLIC_BRANCHES_API;
    
    if (!branchesApiUrl) {
      console.error('BRANCHES_API environment variable is not defined');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }
    
    // Make the actual API call
    const response = await fetch(branchesApiUrl, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to process branch data:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to process branch data: ${response.status}` },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Branches API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 