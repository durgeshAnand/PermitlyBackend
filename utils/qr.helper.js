import crypto from 'crypto';

export const generateQRCode = async (visitorData) => {
    // Generate a unique QR code data using visitor details and timestamp
    const timestamp = Date.now();
    const {
        visitor_id,
        name,
        phone_number,
        purpose_of_visit
    } = visitorData;

    // Create a data string with all visitor information
    const data = JSON.stringify({
        visitor_id,
        name,
        phone_number,
        purpose_of_visit,
        timestamp
    });

    // Generate a hash of the data for security
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    // Return both the encoded data and its hash
    return {
        qr_data: Buffer.from(data).toString('base64'), // Encoded visitor data
        hash // For verification
    };
};
