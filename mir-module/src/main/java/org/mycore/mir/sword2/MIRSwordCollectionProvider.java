package org.mycore.mir.sword2;

import java.util.Arrays;
import java.util.List;

import org.apache.solr.client.solrj.SolrQuery;
import org.mycore.sword.application.MCRSwordAuthHandler;
import org.mycore.sword.application.MCRSwordCollectionProvider;
import org.mycore.sword.application.MCRSwordDefaultAuthHandler;
import org.mycore.sword.application.MCRSwordIngester;
import org.mycore.sword.application.MCRSwordLifecycleConfiguration;
import org.mycore.sword.application.MCRSwordMetadataProvider;
import org.mycore.sword.application.MCRSwordObjectIDSupplier;
import org.mycore.sword.application.MCRSwordSolrObjectIDSupplier;
import org.swordapp.server.UriRegistry;

/**
 * @author Sebastian Hofmann (mcrshofm)
 */
public class MIRSwordCollectionProvider extends MCRSwordCollectionProvider {

    private MCRSwordDefaultAuthHandler mcrSwordDefaultAuthHandler;

    private MIRSwordMetadataProvider mirSwordMetadataProvider;

    private MIRSwordIngester mirSwordIngester;

    private MCRSwordSolrObjectIDSupplier mcrSwordSolrObjectIDSupplier;

    public MIRSwordCollectionProvider() {
        mcrSwordDefaultAuthHandler = new MCRSwordDefaultAuthHandler();
        mirSwordMetadataProvider = new MIRSwordMetadataProvider();
        mirSwordIngester = new MIRSwordIngester();
        mcrSwordSolrObjectIDSupplier = new MCRSwordSolrObjectIDSupplier(new SolrQuery("objectType:mods"));
    }

    @Override
    public boolean isVisible() {
        // this collection can be seen by everybody
        return true;
    }

    @Override
    public List<String> getSupportedPagacking() {
        return Arrays.asList(UriRegistry.PACKAGE_SIMPLE_ZIP);
    }

    @Override
    public MCRSwordObjectIDSupplier getIDSupplier() {
        return mcrSwordSolrObjectIDSupplier;
    }

    @Override
    public MCRSwordIngester getIngester() {
        return mirSwordIngester;
    }

    @Override
    public MCRSwordMetadataProvider getMetadataProvider() {
        return mirSwordMetadataProvider;
    }

    @Override
    public MCRSwordAuthHandler getAuthHandler() {
        return mcrSwordDefaultAuthHandler;
    }

    @Override
    public void init(MCRSwordLifecycleConfiguration lifecycleConfiguration) {
        super.init(lifecycleConfiguration);
    }

    @Override
    public void destroy() {

    }

}
