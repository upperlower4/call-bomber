// এই ফাইলটি Vercel দ্বারা একটি সার্ভারলেস ফাংশন হিসাবে ডিপ্লয় করা হবে।
// এটি Node.js runtime এ চলে।

// গুরুত্বপূর্ণ: আপনার API কী Vercel ড্যাশবোর্ডের Environment Variables এ সেট করতে হবে।
// যেমন: YOUR_CUSTOM_API_KEY = "DH Alamin Hasan"
const TARGET_API_KEY = process.env.YOUR_CUSTOM_API_KEY;

// মূল API যার সাথে আমরা যোগাযোগ করব
const EXTERNAL_CALL_BOMBER_API_URL = "https://call-bombers.vercel.app/send-call";

export default async function handler(req, res) {
    // শুধুমাত্র POST অনুরোধগুলি প্রক্রিয়া করুন
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { number, limits } = req.body; // ক্লায়েন্ট থেকে পাঠানো ডেটা

    // ইনপুট ভ্যালিডেশন
    if (!number || !limits) {
        return res.status(400).json({ error: 'Phone number and limits are required.' });
    }

    // নিশ্চিত করুন যে limits একটি সংখ্যা এবং গ্রহণযোগ্য সীমার মধ্যে আছে
    const parsedLimits = parseInt(limits, 10);
    if (isNaN(parsedLimits) || parsedLimits < 1 || parsedLimits > 100) {
        return res.status(400).json({ error: 'Limits must be a number between 1 and 100.' });
    }

    try {
        // টার্গেট API-তে অনুরোধ পাঠানো হচ্ছে।
        // API কী এখন ব্যাকএন্ডে ব্যবহার করা হচ্ছে, ক্লায়েন্ট-সাইডে নয়।
        const response = await fetch(`${EXTERNAL_CALL_BOMBER_API_URL}?key=${TARGET_API_KEY}&number=${number}&repeat=${parsedLimits}`);

        // যদি টার্গেট API থেকে সফল প্রতিক্রিয়া না আসে
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from external call bomber API:', response.status, errorText);
            // ক্লায়েন্টকে একটি জেনেরিক ত্রুটি বার্তা পাঠান, সংবেদনশীল বিবরণ নয়
            return res.status(response.status).json({
                error: 'Failed to process call request from external API. Please try again later.',
                details: response.status === 401 ? 'Authentication failed with external API.' : 'Unknown error from external API.'
            });
        }

        const data = await response.json(); // টার্গেট API থেকে প্রাপ্ত ডেটা

        // ক্লায়েন্টকে সফল প্রতিক্রিয়া পাঠান
        res.status(200).json({
            message: 'Call request successfully initiated!',
            data: data // টার্গেট API থেকে প্রাপ্ত সম্পূর্ণ ডেটা ক্লায়েন্টে পাঠান
        });

    } catch (error) {
        console.error('Serverless function execution failed:', error);
        res.status(500).json({ error: 'An internal server error occurred. Please try again.' });
    }
}
