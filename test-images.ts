import { writeFile } from "node:fs/promises";
import { createCollagePin, createSingleProductPin } from "./lib/imageCompositor";

async function run() {
  const sampleAmazonImages = [
    "https://m.media-amazon.com/images/I/71GeRoUotCS.jpg",
    "https://m.media-amazon.com/images/I/41vF-oMm5XL.jpg",
    "https://m.media-amazon.com/images/I/61SsqDimfPL.jpg",
    "https://m.media-amazon.com/images/I/71vuK7toJqL.jpg",
  ];

  const singleBuffer = await createSingleProductPin({
    productImageUrl: sampleAmazonImages[0],
    headline: "Build Your Home Gym Faster",
    priceBadge: "$79.99",
    theme: "fitness",
  });

  await writeFile("test-single.jpg", singleBuffer);
  console.log("Saved test-single.jpg");

  const collageBuffer = await createCollagePin({
    productImageUrls: sampleAmazonImages.slice(0, 4),
    headline: "Top Fitness Essentials for Home",
    priceBadge: "Shop the List",
    theme: "fitness",
  });

  await writeFile("test-collage.jpg", collageBuffer);
  console.log("Saved test-collage.jpg");
}

run().catch((error) => {
  console.error("Failed to generate test images:", error);
  process.exit(1);
});
