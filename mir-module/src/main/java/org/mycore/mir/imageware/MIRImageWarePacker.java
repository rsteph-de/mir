package org.mycore.mir.imageware;

import java.io.IOException;
import java.net.URI;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.mycore.access.MCRAccessManager;
import org.mycore.common.config.MCRConfigurationException;
import org.mycore.common.content.MCRContent;
import org.mycore.common.content.transformer.MCRContentTransformer;
import org.mycore.common.content.transformer.MCRContentTransformerFactory;
import org.mycore.datamodel.common.MCRActiveLinkException;
import org.mycore.datamodel.common.MCRXMLMetadataManager;
import org.mycore.datamodel.ifs.MCRContentInputStream;
import org.mycore.datamodel.metadata.MCRMetadataManager;
import org.mycore.datamodel.metadata.MCRObject;
import org.mycore.datamodel.metadata.MCRObjectID;
import org.mycore.datamodel.niofs.MCRPath;
import org.mycore.datamodel.niofs.utils.MCRTreeCopier;
import org.mycore.services.packaging.MCRPacker;

/**
 * <p>Creates the ZIP-Files for the image ware electronic reading room.</p>
 * <p>
 * <b>Parameters:</b>
 * <dl>
 * <dt>objectId</dt>
 * <dd>The objectID which should be packed (Linked derivates are automatic included)</dd>
 * </dl>
 * <p>
 * <b>Configuration:</b>
 * <dl>
 * <dt>TransformerID</dt>
 * <dd>The transformer which should be used to transform the metadata</dd>
 * <dt>Destination</dt>
 * <dd>The destination where the packets should be created</dd>
 * </dl>
 * <p>
 * <p><b>WARNING:</b> The system user needs write permission to the object id </p>
 */
public class MIRImageWarePacker extends MCRPacker {

    private static final Logger LOGGER = LogManager.getLogger();
    private static final String FLAG_TYPE_PARAMETER_NAME = "flagType";

    protected MCRObjectID getObjectID() {
        return MCRObjectID.getInstance(this.getParameters().get("objectId"));
    }

    protected MCRContentTransformer getTransformer() {
        String transformerID = this.getConfiguration().get("TransformerID");
        MCRContentTransformer transformer = MCRContentTransformerFactory.getTransformer(transformerID);
        if (transformer == null) {
            throw new MCRConfigurationException("Could not resolve transformer with id : " + transformerID);
        }

        return transformer;
    }


    @Override
    public void pack() throws ExecutionException {
        MCRObjectID objectID = getObjectID();
        if(!getConfiguration().containsKey(FLAG_TYPE_PARAMETER_NAME)){
            LOGGER.error("No flag type specified in configuration!");
            throw new MCRConfigurationException("No flag type specified in configuration!");
        }

        if (!MCRAccessManager.checkPermission(objectID, MCRAccessManager.PERMISSION_WRITE)) {
            LOGGER.error("No Rights to update metadata of " + objectID);
            throw new MCRConfigurationException("No Rights to update metadata of " + objectID);
        }

        LOGGER.info("Start packing of : " + objectID);
        List<MCRObjectID> derivateIds = MCRMetadataManager.getDerivateIds(objectID, 10, TimeUnit.SECONDS);
        openZip(zipFileSystem -> {
            try {
                // transform & write metadata
                MCRContent modsContent = MCRXMLMetadataManager.instance().retrieveContent(objectID);
                MCRContentInputStream resultStream = getTransformer().transform(modsContent).getContentInputStream();
                Files.copy(resultStream, zipFileSystem.getPath("/", modsContent.getName()));

                // write derivate files
                Consumer<MCRPath> copyDerivates = getCopyDerivateConsumer(zipFileSystem);
                derivateIds.stream()
                        .map(id -> MCRPath.getPath(id.toString(), "/"))
                        .forEach(copyDerivates);
            } catch (IOException e) {
                LOGGER.error("Could get MCRContent for object with id: " + objectID.toString(), e);
            }
        });

        MCRObject mcrObject = MCRMetadataManager.retrieveMCRObject(objectID);
        String flagType = getConfiguration().get(FLAG_TYPE_PARAMETER_NAME);
        mcrObject.getService().setDate(flagType, new Date());
        try {
            MCRMetadataManager.update(mcrObject);
        } catch (MCRActiveLinkException e) {
            LOGGER.error("Could not set " + flagType + " flag!");
            throw new ExecutionException(e);
        }
    }

    private Consumer<MCRPath> getCopyDerivateConsumer(FileSystem zipFileSystem) {
        return path -> {
            Path destinationFolder = zipFileSystem.getPath("/", path.getOwner());
            try {
                Files.createDirectory(destinationFolder);
                MCRTreeCopier derivateToZipCopier = new MCRTreeCopier(path, destinationFolder);
                Files.walkFileTree(path, derivateToZipCopier);
            } catch (IOException e) {
                LOGGER.error("Error while writing to ZIP: " + getTargetZipPath().toString(), e);
            }
        };
    }

    @Override
    public void rollback() {
        Path filePath = getTargetZipPath();
        LOGGER.info("Rollback: Check for existing ImageWarePackage: " + filePath.toString());
        if (Files.exists(filePath)) {
            LOGGER.info("Rollback: File found, try to delete: " + filePath.toString());
            try {
                Files.delete(filePath);
            } catch (IOException e) {
                LOGGER.error("Could not delete file " + filePath.toString(), e);
            }
        }
    }

    private Path getTargetZipPath() {
        String targetFolderPath = this.getConfiguration().get("Destination");
        String fileName = getObjectID().toString() + ".zip";
        return FileSystems.getDefault().getPath(targetFolderPath, fileName);
    }

    private URI openZip(Consumer<FileSystem> fileSystemConsumer) {
        URI destination = getTargetZipPath().toUri();
        Map<String, String> env = new HashMap<>();
        env.put("create", "true");
        URI uri = URI.create("jar:" + destination.toString());
        try (FileSystem zipFs = FileSystems.newFileSystem(uri, env)) {
            fileSystemConsumer.accept(zipFs);
        } catch (IOException e) {
            LOGGER.error("Could not create/write to zip file: " + destination.toString(), e);
        }
        return uri;
    }
}