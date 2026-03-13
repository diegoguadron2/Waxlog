import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import { resetDB } from '../database/Index';

export const backupService = {
  // Guardar backup
  saveBackup: async () => {
    try {
      const dbFile = new File(Paths.document, 'SQLite', 'bitacora.db');

      if (!dbFile.exists) {
        Alert.alert('❌ Error', 'No hay base de datos para respaldar.');
        return;
      }

      console.log('✅ Base de datos encontrada en:', dbFile.uri);

      const backupDir = new Directory(Paths.cache, 'bitacora_backups');
      if (!backupDir.exists) {
        await backupDir.create();
      }

      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const backupFileName = `backup_${dateStr}.db`;
      const backupFile = new File(backupDir, backupFileName);

      await dbFile.copy(backupFile);
      console.log('✅ Backup copiado a:', backupFile.uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFile.uri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Guardar backup',
          UTI: 'public.data'
        });

        setTimeout(async () => {
          if (backupFile.exists) {
            await backupFile.delete();
            console.log('🧹 Archivo temporal eliminado.');
          }
        }, 60000);
      } else {
        Alert.alert('❌ Error', 'No se puede compartir el archivo en este dispositivo.');
      }
    } catch (error) {
      console.error('Error en saveBackup:', error);
      Alert.alert('❌ Error', 'No se pudo guardar el backup: ' + error.message);
    }
  },

  // Restaurar backup
  restoreBackup: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];
      if (!selectedFile.name.endsWith('.db')) {
        Alert.alert('❌ Error', 'El archivo seleccionado no es un backup válido (debe tener extensión .db).');
        return;
      }

      Alert.alert(
        '⚠️ Confirmar restauración',
        'Esta acción reemplazará toda tu biblioteca actual. Se recomienda hacer un backup primero. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              try {
                await resetDB();
                console.log('🔄 Conexión a BD cerrada');

                await new Promise(resolve => setTimeout(resolve, 500));

                const backupFile = new File(selectedFile.uri);
                const destinationFile = new File(Paths.document, 'SQLite', 'bitacora.db');

                const autoBackupDir = new Directory(Paths.cache, 'auto_backups');
                if (!autoBackupDir.exists) {
                  await autoBackupDir.create();
                }
                const autoBackupFile = new File(autoBackupDir, `before_restore_${Date.now()}.db`);

                if (destinationFile.exists) {
                  await destinationFile.copy(autoBackupFile);
                  console.log('✅ Backup automático creado en:', autoBackupFile.uri);
                }

                const destDir = new Directory(Paths.document, 'SQLite');
                if (!destDir.exists) {
                  await destDir.create();
                }

                if (destinationFile.exists) {
                  await destinationFile.delete();
                  await new Promise(resolve => setTimeout(resolve, 500));
                }

                await backupFile.copy(destinationFile);
                console.log('✅ Backup restaurado en:', destinationFile.uri);


                try {
                  const tempDB = await SQLite.openDatabaseAsync(destinationFile.uri);
                  await tempDB.closeAsync();
                  console.log('✅ Permisos de escritura verificados');
                } catch (e) {
                  console.log('⚠️ No se pudieron verificar permisos:', e);
                }

                Alert.alert(
                  '✅ Restauración completada',
                  'Los datos han sido restaurados. La aplicación se reiniciará para aplicar los cambios.',
                  [
                    {
                      text: 'Reiniciar ahora',
                      onPress: () => {
                        if (__DEV__) {
                          Alert.alert(
                            'Recarga manual',
                            'En desarrollo, recarga la app con R o cierra y vuelve a abrir.'
                          );
                        } else {
                          Alert.alert(
                            'Cierra la app',
                            'Para aplicar los cambios, cierra y vuelve a abrir la aplicación manualmente.'
                          );
                        }
                      }
                    },
                    {
                      text: 'Después',
                      style: 'cancel'
                    }
                  ]
                );

              } catch (restoreError) {
                console.error('Error durante la restauración:', restoreError);
                Alert.alert('❌ Error', 'No se pudo restaurar el backup: ' + restoreError.message);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error en restoreBackup:', error);
      Alert.alert('❌ Error', 'No se pudo seleccionar el archivo: ' + error.message);
    }
  },

  // Obtener información del backup
  getBackupInfo: async () => {
    try {
      const dbFile = new File(Paths.document, 'SQLite', 'bitacora.db');

      if (!dbFile.exists) {
        return { exists: false };
      }

      const fileInfo = await dbFile.info();
      const sizeInMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
      const lastModified = fileInfo.modificationTime
        ? new Date(fileInfo.modificationTime).toLocaleDateString()
        : 'Desconocido';

      return {
        exists: true,
        size: sizeInMB,
        lastModified: lastModified
      };
    } catch (error) {
      console.error('Error en getBackupInfo:', error);
      return { exists: false };
    }
  }
};