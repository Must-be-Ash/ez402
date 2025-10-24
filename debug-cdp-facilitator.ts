import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugCDPFacilitator() {
  const { createFacilitatorConfig } = await import('@coinbase/x402');
  const facilitatorConfig = createFacilitatorConfig(
    process.env.CDP_API_KEY_ID!,
    process.env.CDP_API_KEY_SECRET!
  );

  console.log('CDP Facilitator Config:');
  console.log('URL:', facilitatorConfig.url);
  console.log('Has createAuthHeaders:', !!facilitatorConfig.createAuthHeaders);

  if (facilitatorConfig.createAuthHeaders) {
    const headers = await facilitatorConfig.createAuthHeaders();
    console.log('\nAuth Headers Structure:', Object.keys(headers));
    console.log('\n📝 Note: CDP Facilitator should handle gas-less settlement');
    console.log('   The "unable to estimate gas" error suggests the transaction would revert.');
    console.log('   Common causes:');
    console.log('   - Payment nonce already used');
    console.log('   - Payment authorization expired (validBefore timestamp passed)');
    console.log('   - Signature invalid or for wrong chain');
  }
}

debugCDPFacilitator();
