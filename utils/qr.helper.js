import crypto from 'crypto';

export const generateQRCode = async (visitorData) => {
    const {
        visitor_id,
        name,
        phone_number,
        purpose_of_visit,
        host,
        status
    } = visitorData;

    // Create a data string with only essential visitor and host information
    const data = JSON.stringify({
        visitor: {
            id: visitor_id,
            name,
            phone_number,
            purpose_of_visit,
            status
        },
        host: {
            name: host.name,
            phone_number: host.phone_number
        },
        issuedAt: new Date().toISOString(),
        expiry: new Date(timestamp + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    // Generate a hash of the data for security
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    // Return both the encoded data and its hash
    return {
        qr_data: Buffer.from(data).toString('base64'), // Encoded visitor data
        hash // For verification
    };
};
