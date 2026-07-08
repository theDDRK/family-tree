export const getBookmarks = (): string[] => {
    const stored = localStorage.getItem('bookmarks');
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (err) {
        console.error('Failed to parse bookmarks from localStorage', err);
        return [];
    }
};

export const isBookmarked = (pointer: string): boolean => {
    const list = getBookmarks();
    return list.includes(pointer);
};

export const toggleBookmark = (pointer: string): boolean => {
    const list = getBookmarks();
    const index = list.indexOf(pointer);
    let newStatus = false;
    
    if (index === -1) {
        list.push(pointer);
        newStatus = true;
    } else {
        list.splice(index, 1);
        newStatus = false;
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(list));
    // Dispatch a custom event to notify components that bookmarks changed
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    return newStatus;
};
