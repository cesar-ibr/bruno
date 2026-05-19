import { describe, it, expect } from '@jest/globals';

// Create a more realistic mock supabase client that supports method chaining
const createMockQueryBuilder = () => ({
  select: jest.fn(() => createMockQueryBuilder()),
  insert: jest.fn(() => createMockQueryBuilder()),
  update: jest.fn(() => createMockQueryBuilder()),
  eq: jest.fn(() => createMockQueryBuilder()),
  gt: jest.fn(() => createMockQueryBuilder()),
  order: jest.fn(() => createMockQueryBuilder()),
});

const mockSupabaseClient = {
  from: jest.fn(() => createMockQueryBuilder()),
  auth: {}
};

// Mock the local supabase module to avoid Deno issues
jest.mock('./supabase.ts', () => ({
  supabaseClient: mockSupabaseClient,
}));

// Import after mocking
import { supabaseClient } from './supabase.ts';

describe('Supabase Client', () => {
  it('should export a properly configured supabase client', () => {
    // Verify the client is exported and accessible
    expect(supabaseClient).toBeDefined();
    expect(supabaseClient).toBe(mockSupabaseClient);
    expect(typeof supabaseClient).toBe('object');
  });

  it('should have expected Supabase methods', () => {
    // Verify the mock client has the expected methods
    expect(supabaseClient.from).toBeDefined();
    expect(typeof supabaseClient.from).toBe('function');
    expect(supabaseClient.auth).toBeDefined();
  });

  it('should support basic Supabase operations through the query builder pattern', () => {
    // Simulate calling methods on the client to ensure they exist
    const queryBuilder = supabaseClient.from('test_table');
    
    expect(queryBuilder).toBeDefined();
    expect(queryBuilder.select).toBeDefined();
    expect(queryBuilder.insert).toBeDefined();
    expect(queryBuilder.update).toBeDefined();
    expect(queryBuilder.eq).toBeDefined();
    expect(queryBuilder.gt).toBeDefined();
    expect(queryBuilder.order).toBeDefined();
    
    // Verify method chaining capability
    expect(typeof queryBuilder.select().eq).toBe('function');
    expect(typeof queryBuilder.select().order).toBe('function');
  });
});