# Phynetix landing, checkout, and profile refresh

## What will change
- Rebuild the landing page in the selected Electric Education Journey direction: light by default, electric blue, focused sections, truthful product copy, real exam categories, and the existing test-interface preview.
- Replace the current green/black default theme with semantic light-blue tokens while retaining an accessible dark option.
- Expand checkout to collect and validate name, email, phone, class, country, state, city, and coupon code; prefill known profile details, save updates before enrollment, and prefill Razorpay so students do not re-enter email or phone.
- Rebuild the student profile page around the same personal and academic details, including state and district/city information.
- Add the missing profile field needed to persist country, with user-owned access retained.
- Verify the landing page at desktop and mobile sizes, confirm checkout/profile behavior, and test the Razorpay flow through opening the payment window and validating the available test-mode boundary.

## Technical details
- Keep all colors in shared semantic theme tokens and use existing design-system controls.
- Use schema validation for form input and enforce length/format limits before saving or opening Razorpay.
- Pass only validated prefill data to the payment window.
- Keep existing enrollment, coupon, payment verification, and profile-completion behavior intact.
