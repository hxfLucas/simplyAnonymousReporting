import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initialValue when the key is not in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value] = result.current;
    expect(value).toBe('default');
  });

  it('returns the parsed stored value when the key already exists in localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    const [value] = result.current;
    expect(value).toBe('stored-value');
  });

  it('setValue(newValue) persists to localStorage and updates state', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('updated');
    });

    const [value] = result.current;
    expect(value).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated');
  });

  it('setValue(fn) — function updater receives the previous value', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
    expect(JSON.parse(localStorage.getItem('counter')!)).toBe(1);
  });

  it('removeValue() removes the key from localStorage and resets state to initialValue', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    // verify pre-condition
    expect(result.current[0]).toBe('stored');

    act(() => {
      const [, , removeValue] = result.current;
      removeValue();
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('handles corrupt JSON in localStorage and falls back to initialValue', () => {
    localStorage.setItem('bad-json', '{not valid json}');
    const { result } = renderHook(() => useLocalStorage('bad-json', 'fallback'));
    const [value] = result.current;
    expect(value).toBe('fallback');
  });

  it('two hooks with different keys are independent', () => {
    const { result: r1 } = renderHook(() => useLocalStorage('key-a', 'a'));
    const { result: r2 } = renderHook(() => useLocalStorage('key-b', 'b'));

    act(() => {
      r1.current[1]('updated-a');
    });

    expect(r1.current[0]).toBe('updated-a');
    expect(r2.current[0]).toBe('b'); // unchanged
    expect(localStorage.getItem('key-b')).toBeNull();
  });
});
