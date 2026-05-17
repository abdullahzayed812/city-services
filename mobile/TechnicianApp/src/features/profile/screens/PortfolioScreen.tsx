import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {launchImageLibrary} from 'react-native-image-picker';
import {apiClient, mediaUrl} from '@api/client';
import {ar} from '@i18n/ar';

const {width} = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

interface PortfolioImage {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export default function PortfolioScreen() {
  const qc = useQueryClient();
  const [caption, setCaption] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<PortfolioImage | null>(null);

  const {data: images, isLoading} = useQuery({
    queryKey: ['my-portfolio'],
    queryFn: async () => {
      const res = await apiClient.get('/technicians/me/portfolio');
      return res.data.data as PortfolioImage[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const form = new FormData();
      form.append('image', {
        uri: selectedFile.uri,
        name: selectedFile.fileName ?? 'photo.jpg',
        type: selectedFile.type ?? 'image/jpeg',
      } as any);
      if (caption.trim()) form.append('caption', caption.trim());
      await apiClient.post('/technicians/me/portfolio', form, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['my-portfolio']});
      setAddModalVisible(false);
      setSelectedFile(null);
      setCaption('');
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiClient.delete(`/technicians/me/portfolio/${imageId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['my-portfolio']});
      setPreviewImage(null);
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.assets?.[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const confirmDelete = (image: PortfolioImage) => {
    Alert.alert('حذف الصورة', 'هل تريد حذف هذه الصورة من معرض أعمالك؟', [
      {text: ar.common.cancel, style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(image.id),
      },
    ]);
  };

  const renderItem = ({item}: {item: PortfolioImage}) => (
    <TouchableOpacity style={styles.imageWrap} onPress={() => setPreviewImage(item)}>
      <Image source={{uri: mediaUrl(item.image_url)}} style={styles.thumb} />
      {item.caption ? (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={1}>{item.caption}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      ) : (
        <FlatList
          data={images ?? []}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🖼️</Text>
              <Text style={styles.emptyText}>لا توجد صور في معرض أعمالك بعد</Text>
              <Text style={styles.emptyHint}>أضف صوراً لأعمالك لتجذب المزيد من العملاء</Text>
            </View>
          }
        />
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{ar.profile.addPortfolio}</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {selectedFile ? (
                <Image source={{uri: selectedFile.uri}} style={styles.pickedImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={styles.imagePickerIcon}>📷</Text>
                  <Text style={styles.imagePickerText}>اختر صورة</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.captionInput}
              placeholder="وصف العمل (اختياري)"
              placeholderTextColor="#aaa"
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setAddModalVisible(false);
                  setSelectedFile(null);
                  setCaption('');
                }}>
                <Text style={styles.cancelBtnText}>{ar.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (!selectedFile || addMutation.isPending) && styles.btnDisabled]}
                onPress={() => addMutation.mutate()}
                disabled={!selectedFile || addMutation.isPending}>
                {addMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>رفع</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview modal */}
      <Modal visible={!!previewImage} animationType="fade" transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>
          {previewImage && (
            <>
              <Image source={{uri: mediaUrl(previewImage.image_url)}} style={styles.previewImage} resizeMode="contain" />
              {previewImage.caption ? (
                <Text style={styles.previewCaption}>{previewImage.caption}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(previewImage)}
                disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteBtnText}>🗑 حذف الصورة</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 32},
  emptyIcon: {fontSize: 52, marginBottom: 16},
  emptyText: {fontSize: 15, color: '#555', fontFamily: 'Cairo-SemiBold', textAlign: 'center', marginBottom: 8},
  emptyHint: {fontSize: 13, color: '#aaa', fontFamily: 'Cairo-Regular', textAlign: 'center'},
  grid: {padding: 12},
  imageWrap: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  thumb: {width: '100%', height: '100%'},
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  captionText: {fontSize: 9, color: '#fff', fontFamily: 'Cairo-Regular'},

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#1a237e',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  fabIcon: {fontSize: 28, color: '#fff', lineHeight: 30},

  // Add modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {fontSize: 17, fontWeight: 'bold', color: '#1a237e', marginBottom: 20, textAlign: 'center', fontFamily: 'Cairo-Bold'},
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  pickedImage: {width: '100%', height: '100%'},
  imagePickerPlaceholder: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  imagePickerIcon: {fontSize: 40, marginBottom: 8},
  imagePickerText: {fontSize: 14, color: '#888', fontFamily: 'Cairo-Regular'},
  captionInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
  },
  modalActions: {flexDirection: 'row', gap: 12},
  cancelBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center'},
  cancelBtnText: {fontSize: 14, color: '#555', fontFamily: 'Cairo-SemiBold'},
  submitBtn: {flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a237e', alignItems: 'center'},
  submitBtnText: {fontSize: 14, color: '#fff', fontFamily: 'Cairo-SemiBold'},
  btnDisabled: {opacity: 0.45},

  // Preview modal
  previewOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center'},
  previewClose: {position: 'absolute', top: 48, right: 20, padding: 8},
  previewCloseText: {fontSize: 22, color: '#fff'},
  previewImage: {width: width, height: width},
  previewCaption: {fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo-Regular', marginTop: 16, paddingHorizontal: 24, textAlign: 'center'},
  deleteBtn: {
    marginTop: 24,
    backgroundColor: '#c62828',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  deleteBtnText: {fontSize: 14, color: '#fff', fontFamily: 'Cairo-SemiBold'},
});
