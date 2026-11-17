import type { io } from '@tensorflow/tfjs-core';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import modelJson from '../../assets/ml/doodlenet/model.json';
import weightShard from '../../assets/ml/doodlenet/group1-shard1of1.bin';

type WeightSpec = NonNullable<io.ModelArtifacts['weightSpecs']>[number];
type WeightGroup = { weights: WeightSpec[] };

async function readShard(): Promise<ArrayBuffer> {
  const [asset] = await Asset.loadAsync(weightShard);
  const uri = asset.localUri ?? asset.uri;

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.arrayBuffer();
  }

  return new File(uri).arrayBuffer();
}

export async function loadDoodleNetArtifacts(): Promise<io.ModelArtifacts> {
  const weightData = await readShard();

  return {
    modelTopology: modelJson.modelTopology,
    weightSpecs: (modelJson.weightsManifest as WeightGroup[]).flatMap((group) => group.weights),
    weightData,
    format: 'layers-model',
    generatedBy: modelJson.generatedBy,
    convertedBy: modelJson.convertedBy,
  };
}
