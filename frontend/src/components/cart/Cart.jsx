import React from 'react';
import MetaData from "../layout/MetaData";
import { useDispatch, useSelector } from "react-redux"
import { setCartItem , removeCartItems } from '../../redux/features/cartSlice';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {

    const { cartItems } = useSelector((state) => state.cart);

    const dispatch = useDispatch();

    const navigate = useNavigate()


    const increaseQty = (item , quantity) => {
        const newQty = quantity + 1;

        if(newQty >= item?.stock) return;

        setItemsToCart(item , newQty);
    }

    const decreaseQty = (item , quantity) => {
        const newQty = quantity - 1;

        if(newQty <= 0) return;

        setItemsToCart(item , newQty);
    }

    // setting items to cart
    const setItemsToCart = (item,newQty) => {
        const cartItem = {
            product : item?.product,
            name : item?.name,
            price : item?.price,
            image : item?.image,
            stock : item?.stock,
            quantity : newQty,        
        }

        dispatch(setCartItem(cartItem));
    }

    const removeCartItemsHandler = (id) => {

        dispatch(removeCartItems(id))

    }

    const checkoutHandler = () => {
        navigate("/shipping")
    }

    return (
        <>
            <MetaData title={"Your Cart"} />

            {cartItems?.length === 0 ? (
                <h2 className='mt-5'>Your Cart is Empty</h2>
            ) : (
                <>
                    <h2 className="mt-5">Your Cart: <b>{cartItems?.length} items</b></h2>

                    {/* Parent container to align cart and order summary side by side */}
                    <div className="row d-flex justify-content-between">
                        {/* Cart Items Section */}
                        <div className="col-12 col-lg-8">
                            {cartItems?.map((item, index) => (
                                <React.Fragment key={index}>
                                    <hr />
                                    <div className="cart-item" data-key="product1">
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                <img
                                                    src={item?.image}
                                                    alt="Laptop"
                                                    height="90"
                                                    width="115"
                                                />
                                            </div>
                                            <div className="col-5 col-lg-3">
                                                <Link to={`/products/${item?.product}`}> {item?.name} </Link>
                                            </div>
                                            <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                <p id="card_item_price">{item?.price}</p>
                                            </div>
                                            <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                <div className="stockCounter d-inline">
                                                    <span className="btn btn-danger minus" onClick={() => decreaseQty(item,item?.quantity)}> - </span>
                                                    <input
                                                        type="number"
                                                        className="form-control count d-inline"
                                                        value={item?.quantity}
                                                        readOnly
                                                    />
                                                    <span className="btn btn-primary plus" onClick={() => increaseQty(item,item?.quantity)}> + </span>
                                                </div>
                                            </div>
                                            <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                                                <i id="delete_cart_item" onClick={() => removeCartItemsHandler(item?.product)} className="fa fa-trash btn btn-danger"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Order Summary Section */}
                        <div className="col-12 col-lg-3 my-4">
                            <div id="order_summary">
                                <h4>Order Summary</h4>
                                <hr />
                                <p>Units: <span className="order-summary-values">{
                                    cartItems.reduce((acc,item) => acc + item?.quantity , 0)
                                }{" "}(Units)</span></p>
                                <p>Est. total: <span className="order-summary-values">${
                                    cartItems.reduce((acc,item) => acc + item?.quantity * item?.price , 0).toFixed(2)
                                }</span></p>
                                <hr />
                                <button id="checkout_btn" className="btn btn-primary w-100" onClick={checkoutHandler}>
                                    Check out
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default Cart;
