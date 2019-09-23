/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isSignedIn } from 'Util/Auth';
import { showNotification } from 'Store/Notification';
import { WishlistDispatcher } from 'Store/Wishlist';
import { ProductType } from 'Type/ProductList';
import { getExtensionAttributes } from 'Util/Product';
import ProductWishlistButton from './ProductWishlistButton.component';

export const mapStateToProps = state => ({
    productsInWishlist: state.WishlistReducer.productsInWishlist,
    isLoading: state.WishlistReducer.isLoading
});

export const mapDispatchToProps = dispatch => ({
    addProductToWishlist: options => WishlistDispatcher.addItemToWishlist(dispatch, options),
    removeProductFromWishlist: options => WishlistDispatcher.removeItemFromWishlist(dispatch, options),
    showNotification: (type, message) => dispatch(showNotification(type, message))
});

export const ERROR_CONFIGURABLE_NOT_PROVIDED = 'ERROR_CONFIGURABLE_NOT_PROVIDED';

export class ProductWishlistButtonContainer extends PureComponent {
    static propTypes = {
        quantity: PropTypes.number,
        product: ProductType.isRequired,
        isLoading: PropTypes.bool.isRequired,
        configurableVariantIndex: PropTypes.number,
        showNotification: PropTypes.func.isRequired,
        productsInWishlist: PropTypes.objectOf(ProductType).isRequired,
        addProductToWishlist: PropTypes.func.isRequired,
        removeProductFromWishlist: PropTypes.func.isRequired
    };

    static defaultProps = {
        quantity: 1,
        configurableVariantIndex: -2
    };

    containerProps = () => ({
        isDisabled: this.isDisabled(),
        isInWishlist: this.isInWishlist()
    });

    containerFunctions = () => ({
        addToWishlist: this.toggleProductInWishlist.bind(this, true),
        removeFromWishlist: this.toggleProductInWishlist.bind(this, false)
    });

    toggleProductInWishlist = (add = true) => {
        const {
            product: { sku },
            quantity,
            isLoading,
            showNotification,
            productsInWishlist,
            addProductToWishlist,
            removeProductFromWishlist
        } = this.props;

        if (isLoading) return null;

        if (!isSignedIn()) {
            return showNotification('error', __('You must login or register to add items to your wishlist.'));
        }

        const product = this._getProductVariant();
        if (product === ERROR_CONFIGURABLE_NOT_PROVIDED) {
            return showNotification('error', __('Plaese, select desireable variant first!'));
        }

        const { sku: variantSku, product_option } = product;
        if (add) return addProductToWishlist({ sku, product_option, quantity });

        const { item_id } = productsInWishlist[variantSku];
        return removeProductFromWishlist({ item_id, sku: variantSku });
    };

    isDisabled = () => {
        const { isLoading } = this.props;
        const product = this._getProductVariant();

        if (product === ERROR_CONFIGURABLE_NOT_PROVIDED) return true;
        return isLoading;
    };

    isInWishlist = () => {
        const { productsInWishlist } = this.props;
        const product = this._getProductVariant();

        if (product === ERROR_CONFIGURABLE_NOT_PROVIDED) return false;

        const { sku } = product;
        return sku in productsInWishlist;
    };

    _getProductVariant() {
        const {
            product,
            product: { type_id },
            configurableVariantIndex
        } = this.props;

        if (type_id === 'configurable') {
            if (configurableVariantIndex < 0) return ERROR_CONFIGURABLE_NOT_PROVIDED;

            const extension_attributes = getExtensionAttributes({ ...product, configurableVariantIndex });
            const variant = product.variants[configurableVariantIndex];

            return { ...variant, product_option: { extension_attributes } };
        }

        return product;
    }

    render() {
        return (
            <ProductWishlistButton
              { ...this.props }
              { ...this.containerProps() }
              { ...this.containerFunctions() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProductWishlistButtonContainer);
