const parseInputToNumericId = (input: string, type?: 'nation' | 'alliance'): number => {
    let processedInput = input;
    if (input.startsWith('http')) {
        // Input is a link
        if (!input.startsWith('https')) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed that is non-HTTPS. Received: ${input}`,
            );
        }
        if (!type) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed but type is not passed; quit parsing. Received: ${input}`,
            );
        }
        if (!input.includes(type)) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed but type is not matching. Received: ${input} | Expected ${type}`,
            );
        }
        const stringId = input.split('=')?.[1];
        if (!stringId) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed that does not have an ID at the end or has query parameters that are not recognized. Received: ${input}`,
            );
        }
        processedInput = stringId;
    }
    const parsedNumber = Number(processedInput);
    if (Number.isNaN(parsedNumber))
        throw new Error(
            `[parseInputToNumericId] A processed input was passed that is not a number. Received: ${processedInput}`,
        );
    return parsedNumber;
};

export const parseNationLinkInput = (input: string | null): number | null => {
    if (!input) return null;
    return parseInputToNumericId(input, 'nation');
};
