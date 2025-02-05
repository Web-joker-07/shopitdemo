import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Stripe from "stripe";
const stripe = Stripe(process.env.STRIPE_API_KEY);
import Order from "../models/order.js"


export const stripeCheckoutSession = catchAsyncErrors(async (req, res, next) => {

    const body = req?.body;

    const shippingInfo = body?.shippingInfo;

    const line_items = body?.orderItems?.map((item) => {
        return {
            price_data: {
                currency: "usd",
                product_data: {
                    name: item?.name,
                    images: [item?.image],
                    metadata: { productId: item?.product }
                },
                unit_amount: item?.price * 100,
            },
            tax_rates: ["txr_1QBVQ4LbjSyVhEBQY53DtrTQ"],
            quantity: item?.quantity
        }
    })

    const shipping_rate = body?.itemsPrice >= 200 ?
        "shr_1QBVM9LbjSyVhEBQNw3he2mF" :
        "shr_1QBVLHLbjSyVhEBQrj9AboVY";

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: `${process.env.FRONTEND_URL}/me/orders?order_success=true`,
        cancel_url: `${process.env.FRONTEND_URL}`,
        customer_email: req?.user?.email,
        client_reference_id: req?.user?._id.toString(),
        mode: "payment",
        metadata: { ...shippingInfo, itemsPrice: body?.itemsPrice },
        shipping_options: [{
            shipping_rate
        }],
        line_items,
    });


    res.status(200).json({
        url: session.url,
    })

})


const getOrderItems = async (line_items) => {
    const cartItems = await Promise.all(
        line_items?.data?.map(async (item) => {
            const product = await stripe.products.retrieve(item.price.product);
            const productId = product.metadata.productId;

            return {
                product: productId,
                name: product.name,
                price: item.price.unit_amount_decimal / 100,
                quantity: item.quantity,
                image: product.images[0],
            };
        })
    );

    return cartItems;
};



export const stripeWebhook = catchAsyncErrors(async (req, res, next) => {
    try {
        const signature = req.headers["stripe-signature"];
        console.log("Signature:", signature); // Log the signature

        const event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Stripe Event:", event.type); // Log event type

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            const line_items = await stripe.checkout.sessions.listLineItems(
                session.id
            );

            // Await getOrderItems here to ensure it completes
            const orderItems = await getOrderItems(line_items);
            const user = session.client_reference_id;
            const totalAmount = session.amount_total / 100;
            const taxAmount = session.total_details.amount_tax / 100;
            const shippingAmount = session.total_details.amount_shipping / 100;
            const itemsPrice = session.metadata.itemsPrice;

            const shippingInfo = {
                address: session.metadata.address,
                city: session.metadata.city,
                phoneNo: session.metadata.phoneNo,
                zipCode: session.metadata.zipCode,
                country: session.metadata.country,
            };

            const paymentInfo = {
                id: session.payment_intent,
                status: session.payment_status,
            };

            const orderData = {
                shippingInfo,
                orderItems,
                itemsPrice,
                taxAmount,
                shippingAmount,
                totalAmount,
                paymentInfo,
                paymentMethod: "Card",
                user,
            };

            const order = await Order.create(orderData);

            res.status(200).json({
                success: true,
            });
        } else {
            console.log("Event type not handled:", event.type);
        }
    } catch (error) {
        console.log("Webhook error:", error.message);
        res.status(400).json({ error: "Webhook error", message: error.message });
    }
});




 