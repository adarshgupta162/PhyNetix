# Logo Assets

This directory contains logos for colleges and test series displayed on the landing page.

## Directory Structure

```
logos/
├── colleges/          # IIT/NIT college logos
│   ├── iit-bombay.png
│   ├── iit-delhi.png
│   ├── iit-madras.png
│   └── ... (other college logos)
└── test-series/       # Test series logos
    ├── jee-main.png
    ├── jee-advanced.png
    ├── bitsat.png
    ├── mht-cet.png
    └── neet.png
```

## College Logos

Download official logos from the respective college websites:

### IIT Logos
- **IIT Bombay**: https://www.iitb.ac.in
- **IIT Delhi**: https://www.iitd.ac.in
- **IIT Madras**: https://www.iitm.ac.in
- **IIT Kharagpur**: https://www.iitkgp.ac.in
- **IIT Kanpur**: https://www.iitk.ac.in
- **IIT Roorkee**: https://www.iitr.ac.in
- **IIT Guwahati**: https://www.iitg.ac.in
- **IIT Hyderabad**: https://www.iith.ac.in
- **IIT Bhubaneswar**: https://www.iitbbs.ac.in
- **IIT Gandhinagar**: https://www.iitgn.ac.in
- **IIT Jodhpur**: https://www.iitj.ac.in
- **IIT Patna**: https://www.iitp.ac.in
- **IIT Indore**: https://www.iiti.ac.in
- **IIT Mandi**: https://www.iitmandi.ac.in
- **IIT Varanasi (BHU)**: https://www.iitbhu.ac.in
- **IIT Bhilai**: https://www.iitbhilai.ac.in
- **IIT Dharwad**: https://www.iitdh.ac.in

### NIT Logos
- **NIT Tiruchirappalli**: https://www.nitt.edu
- **NIT Rourkela**: https://www.nitrkl.ac.in
- **NIT Silchar**: https://www.nits.ac.in
- **VNIT Nagpur**: https://www.vnit.ac.in
- **NIT Warangal**: https://www.nitw.ac.in
- **NIT Surathkal**: https://www.nitk.ac.in
- **NIT Calicut**: https://www.nitc.ac.in
- **MANIT Bhopal**: https://www.manit.ac.in

## Test Series Logos

Create or download logos for the following test series:

1. **JEE Main** - Official JEE Main logo/emblem
2. **JEE Advanced** - Official JEE Advanced logo/emblem
3. **BITSAT** - BITS Pilani logo/emblem
4. **MHT-CET** - Maharashtra CET logo
5. **NEET** - National Eligibility cum Entrance Test logo

## Image Specifications

- **Format**: PNG with transparent background (preferred) or JPG
- **Size**: 200x200 pixels minimum, 400x400 pixels recommended
- **Aspect Ratio**: Square (1:1) or maintain original college logo aspect ratio
- **File Size**: Keep under 200KB for optimal loading performance
- **Quality**: High-resolution, clear and professional

## Naming Convention

College logos should follow this pattern:
- `{institution}-{location}.png`
- Example: `iit-bombay.png`, `nit-trichy.png`

Test series logos should follow this pattern:
- `{exam-name}.png`
- Example: `jee-main.png`, `neet.png`

## Usage Rights

Ensure you have the right to use these logos. Most educational institution logos are available for fair use in educational contexts, but always check:
1. The institution's brand guidelines
2. Copyright and trademark policies
3. Terms of use for logo usage

## Fallback

If a logo image fails to load or is not found, the application will automatically display a placeholder SVG icon. This ensures the page remains functional even if some logos are missing.

## Adding New Logos

1. Download the high-quality logo from the official website
2. Optimize the image (compress if needed, convert to PNG)
3. Name it according to the convention above
4. Place it in the appropriate directory (`colleges/` or `test-series/`)
5. The landing page will automatically load the new logo

## Testing

After adding logos, test the landing page to ensure:
- All logos load correctly
- They display at the right size
- The page loads quickly (check total logo file sizes)
- Logos look good on both light and dark backgrounds
