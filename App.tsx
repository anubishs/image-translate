import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { toGlossaryPairs, translateImage } from './src/services/translationApi';
import { useProjects } from './src/state/useProjects';

export default function App() {
  const { projects, isLoading, create, addGlossary } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('ja');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [outputImageUri, setOutputImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  async function pickImage() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Media library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
      setOutputImageUri(null);
    }
  }

  async function createAndSelectProject() {
    if (!newProjectName.trim()) {
      setError('Project name is required.');
      return;
    }

    const project = await create(newProjectName.trim(), sourceLanguage, targetLanguage);
    setSelectedProjectId(project.id);
    setNewProjectName('');
    setError(null);
  }

  async function runTranslation() {
    if (!selectedProject) {
      setError('Select a project before translating.');
      return;
    }

    if (!selectedImageUri) {
      setError('Pick an image to translate.');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await translateImage({
        imageUri: selectedImageUri,
        sourceLanguage: selectedProject.sourceLanguage,
        targetLanguage: selectedProject.targetLanguage,
        glossaryContext: selectedProject.glossary,
      });

      setOutputImageUri(result.outputImageUri);

      const newPairs = toGlossaryPairs(
        result.bubbles,
        selectedProject.sourceLanguage,
        selectedProject.targetLanguage,
      );

      if (newPairs.length > 0) {
        await addGlossary(selectedProject.id, newPairs);
      }
    } catch (translateError) {
      const message =
        translateError instanceof Error ? translateError.message : 'Unexpected translation error.';
      setError(message);
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Manga / Manhwa Image Translator</Text>

        <Text style={styles.sectionTitle}>1) Create project context</Text>
        <TextInput
          style={styles.input}
          placeholder="Project name (e.g. Solo Leveling EN)"
          value={newProjectName}
          onChangeText={setNewProjectName}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.compactInput]}
            placeholder="Source (ja/ko/zh)"
            value={sourceLanguage}
            onChangeText={setSourceLanguage}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.compactInput]}
            placeholder="Target (en/es/pt)"
            value={targetLanguage}
            onChangeText={setTargetLanguage}
            autoCapitalize="none"
          />
        </View>
        <Pressable onPress={createAndSelectProject} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Create project</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>2) Select active project</Text>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <Pressable
                key={project.id}
                onPress={() => setSelectedProjectId(project.id)}
                style={[styles.projectRow, isSelected && styles.projectRowActive]}
              >
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectMeta}>
                  {project.sourceLanguage} ➜ {project.targetLanguage} · glossary: {project.glossary.length}
                </Text>
              </Pressable>
            );
          })
        )}

        <Text style={styles.sectionTitle}>3) Pick image and translate</Text>
        <Pressable onPress={pickImage} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Pick image</Text>
        </Pressable>

        {selectedImageUri ? <Image source={{ uri: selectedImageUri }} style={styles.image} /> : null}

        <Pressable
          onPress={runTranslation}
          style={[styles.primaryButton, isTranslating && styles.buttonDisabled]}
          disabled={isTranslating}
        >
          <Text style={styles.primaryButtonText}>
            {isTranslating ? 'Translating...' : 'Translate image'}
          </Text>
        </Pressable>

        {outputImageUri ? (
          <>
            <Text style={styles.sectionTitle}>4) Output</Text>
            <Image source={{ uri: outputImageUri }} style={styles.image} />
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#d3dae8',
    fontWeight: '600',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#1f2430',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#353f52',
  },
  compactInput: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#5c7cfa',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#252b39',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#414f6b',
  },
  secondaryButtonText: {
    color: '#dde7ff',
    fontWeight: '600',
  },
  projectRow: {
    backgroundColor: '#1a1f2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f3748',
    padding: 10,
    gap: 4,
  },
  projectRowActive: {
    borderColor: '#7b9bff',
    backgroundColor: '#20283a',
  },
  projectTitle: {
    color: 'white',
    fontWeight: '600',
  },
  projectMeta: {
    color: '#b4c0dc',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: 380,
    borderRadius: 10,
    backgroundColor: '#11151d',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#ff7e7e',
    fontWeight: '600',
  },
});
