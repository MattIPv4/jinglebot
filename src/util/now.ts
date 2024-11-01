// Util to allow for easy overriding when testing
const getNow = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
};

export default getNow;
