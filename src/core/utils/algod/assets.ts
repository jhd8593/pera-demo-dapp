import { ChainType, clientForChain } from "./algod";
import algosdk from "algosdk";

// Slug Asset IDs
/* eslint-disable no-magic-numbers */
enum SlugAssetId {
  DAGGERPULT = 527479654,
  HAILSTORM = 527477069,
  ZIPACUTE = 527475282,
  SLUGGER = 337228921
}
/* eslint-enable no-magic-numbers */

// Array of all Slug Asset IDs for checking
const SLUG_ASSET_IDS = [
  SlugAssetId.DAGGERPULT,
  SlugAssetId.HAILSTORM,
  SlugAssetId.ZIPACUTE,
  SlugAssetId.SLUGGER
] as const;

// Map of Asset IDs to their names for logging
const SLUG_NAMES: Record<number, string> = {
  [SlugAssetId.DAGGERPULT]: 'Daggerpult',
  [SlugAssetId.HAILSTORM]: 'Hailstorm',
  [SlugAssetId.ZIPACUTE]: 'Zipacute',
  [SlugAssetId.SLUGGER]: 'Slugger'
};

// Minimum number of Slugs required to play
const MIN_SLUGS_REQUIRED = 1;

export async function checkWalletForSlugs(accountAddress: string, chain: ChainType): Promise<boolean> {
  try {
    console.log(`Checking wallet ${accountAddress} on ${chain}`);
    console.log(`Need at least ${MIN_SLUGS_REQUIRED} Slug NFT to play`);
    
    if (!accountAddress) {
      console.error('Account address is empty');
      return false;
    }

    const client = clientForChain(chain);
    console.log('Fetching account information...');
    
    const response = await client.accountInformation(accountAddress).do();
    console.log('Raw account info:', algosdk.stringifyJSON(response));
    
    // Get the assets owned by the account
    const assets = response.assets || [];
    console.log(`Found ${assets.length} total assets in wallet`);
    
    // Log all asset IDs in the wallet and check for Slugs
    let foundSlugs = 0;
    const foundSlugNames: string[] = [];
    
    assets.forEach((asset) => {
      const assetId = Number(asset.assetId);
      const amount = asset.amount;
      
      // Check if this is a Slug ID
      if (SLUG_ASSET_IDS.includes(assetId as SlugAssetId)) {
        const slugName = SLUG_NAMES[assetId];
        if (amount > 0) {
          foundSlugs++;
          foundSlugNames.push(slugName);
          console.log(`✓ Found valid Slug: ${slugName} (ID: ${assetId})`);
        } else {
          console.log(`✗ Found Slug but amount is 0: ${slugName} (ID: ${assetId})`);
        }
      }
    });

    if (foundSlugs >= MIN_SLUGS_REQUIRED) {
      console.log(`✓ Found ${foundSlugs} valid Slugs in wallet: ${foundSlugNames.join(', ')}`);
      console.log('You can now play the game!');
      return true;
    }

    console.log(`✗ Found ${foundSlugs} Slugs but need at least ${MIN_SLUGS_REQUIRED} to play`);
    return false;
  } catch (error) {
    console.error('Error checking wallet for Slugs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}
