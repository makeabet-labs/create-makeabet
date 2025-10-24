export function shortAddress(address, leading = 6, trailing = 4) {
    if (!address)
        return '';
    if (address.length <= leading + trailing + 2) {
        return address;
    }
    return `${address.slice(0, leading + 2)}…${address.slice(-trailing)}`;
}
