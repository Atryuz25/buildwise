require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  console.log("Existing buckets:", data.map(b => b.name));

  const bucketName = 'buildwise-photos';
  if (!data.find(b => b.name === bucketName)) {
    console.log(`Creating bucket: ${bucketName}...`);
    const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg'],
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) {
      console.error("Error creating bucket:", createError);
    } else {
      console.log("Bucket created successfully:", createData);
    }
  } else {
    console.log("Bucket already exists. Updating it to be public...");
    await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg']
    });
  }
}

run();
