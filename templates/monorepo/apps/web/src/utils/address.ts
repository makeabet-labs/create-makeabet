export function shortAddress(address?: string, leading = 6, trailing = 4): string {
  if (!address) return '';
  if (address.length <= leading + trailing + 2) {
    return address;
  }
  return `${address.slice(0, leading + 2)}…${address.slice(-trailing)}`;
}
