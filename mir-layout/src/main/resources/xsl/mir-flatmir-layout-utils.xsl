<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:actionmapping="xalan://org.mycore.wfc.actionmapping.MCRURLRetriever" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="actionmapping">
  <xsl:import href="resource:xsl/layout/mir-common-layout.xsl" />
  <xsl:template name="mir.navigation">

    <div id="header_box" class="clearfix container">
      <div id="options_nav_box" class="mir-prop-nav">
        <nav>
          <ul class="nav navbar-nav pull-right">
            <xsl:call-template name="mir.loginMenu" />
          </ul>
        </nav>
      </div>
      <div id="project_logo_box">
        <a href="{concat($WebApplicationBaseURL,substring($loaded_navigation_xml/@hrefStartingPage,2),$HttpSession)}"
           class="">
          <span id="logo_mir">mir</span>
          <span id="logo_modul">mycore</span>
          <span id="logo_slogan">mods institutional repository</span>
        </a>
      </div>
    </div>

    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="navbar navbar-default mir-main-nav">
      <div class="container">

        <div class="navbar-header">
          <button class="navbar-toggle" type="button" data-toggle="collapse" data-target=".mir-main-nav-entries">
            <span class="sr-only"> Toggle navigation </span>
            <span class="icon-bar">
            </span>
            <span class="icon-bar">
            </span>
            <span class="icon-bar">
            </span>
          </button>
        </div>

        <div class="searchfield_box">
          <form action="{$WebApplicationBaseURL}servlets/solr/find?qry={0}" class="navbar-form navbar-left pull-right" role="search">
            <button type="submit" class="btn btn-default"><i class="fa fa-search"></i></button>
            <div class="form-group">
              <input name="qry" placeholder="Suche" class="form-control search-query" id="searchInput" type="text" />
            </div>
          </form>
        </div>

        <nav class="collapse navbar-collapse mir-main-nav-entries">
          <ul class="nav navbar-nav pull-left">
            <xsl:apply-templates select="$loaded_navigation_xml/menu[@id='search']" />
            <xsl:apply-templates select="$loaded_navigation_xml/menu[@id='browse']" />
            <xsl:apply-templates select="$loaded_navigation_xml/menu[@id='publish']" />
            <xsl:call-template name="mir.basketMenu" />
          </ul>
        </nav>

      </div><!-- /container -->
    </div>
  </xsl:template>
</xsl:stylesheet>