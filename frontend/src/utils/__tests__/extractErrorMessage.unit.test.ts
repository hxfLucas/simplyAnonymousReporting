import { extractErrorMessage } from '../extractErrorMessage';

describe('extractErrorMessage', () => {
  it('returns response.data.message when present (even if response.data.error and message also present)', () => {
    const err = {
      response: { data: { message: 'Data message', error: 'Data error' } },
      message: 'Raw message',
    };
    expect(extractErrorMessage(err, 'fallback')).toBe('Data message');
  });

  it('returns response.data.error when response.data.message is absent', () => {
    const err = {
      response: { data: { error: 'Data error' } },
      message: 'Raw message',
    };
    expect(extractErrorMessage(err, 'fallback')).toBe('Data error');
  });

  it('returns err.message when no response present', () => {
    const err = new Error('Network down');
    expect(extractErrorMessage(err, 'fallback')).toBe('Network down');
  });

  it('returns the fallback string when nothing is present', () => {
    expect(extractErrorMessage({}, 'fallback string')).toBe('fallback string');
  });
});
