<div class="kb-supercheckout-demo-list">
<div class="kb-supercheckout-demo-blk">
    <h3 class="kb-super-demo-heading">{l s='One Page Supercheckout Demo' mod='supercheckout'}</h3>
    <p>{l s='Click below to view the supercheckout demo in different layouts' mod='supercheckout'}</p>
    <div class="kb-super-demo-content col-lg-12">
        <div class="col-lg-4 col-md-4 col-sm-4">
            <a class="btn btn-warning kb-demo-btn" href="{$one_column_link}{*Variable contains url, escape not required*}"><i class="fas fa-square"></i>{l s='Layout 1: One Column' mod='supercheckout'}</a>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4">
            <a class="btn btn-warning kb-demo-btn" href="{$two_column_link}{*Variable contains url, escape not required*}"><i class="fas fa-th-large"></i>{l s='Layout 2: Two Column' mod='supercheckout'}</a>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4">
            <a class="btn btn-warning kb-demo-btn" href="{$three_column_link}{*Variable contains url, escape not required*}"><i class="fas fa-th"></i>{l s='Layout 3: Three Column' mod='supercheckout'}</a>
        </div>
    </div>
</div>
</div>
<div style="clear: both;"></div>
	<style>
            
.fa, .fas { 
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
}
            .fa-th:before {
    content: "\f00a";
}

.fa-th-large:before {
    content: "\f009";
}

.fa-square:before {
    content: "\f0c8";
}
	.kb-supercheckout-demo-list{
            padding:0 15px;
        }
.kb-demo-btn {
background-color: #286090 !important;
border-color: #1f5686 !important;
font-weight: normal;
white-space: normal;
border-radius: 4px;
height: 100%;
display: flex;
align-items: center;
}
.kb-demo-btn .fas {
    color: #e44e3c;
    font-size: 20px;
    display: inline-block;
    vertical-align: text-bottom;
    margin-right: 15px;
    border-right: 1px solid #6e8da9;
    padding-right: 19px;
}
    .kb-demo-btn:hover {
        background-color: #f88c43 !important;
        border-color: #f77219 !important;
    }
    .kb-supercheckout-demo-blk {
    border-radius: 4px;
    text-align: center;
    border: 1px solid #ece9e6;
    clear: both;
    background: #fff;
    margin-bottom: 1.5rem;
    padding: 10px;
    display: inline-block;
    width: 100%;
}
.kb-super-demo-heading {
    font-weight: 500;
    text-align: center;
    font-size: 24px;
    margin-top: 10px;
    color: #dd4b39;
    padding-bottom: 18px;
    position: relative;
    margin-bottom: 13px;
}
.kb-super-demo-heading:after {
    content: '';
    position: absolute;
    border-bottom: 4px solid #286090;
    width: 200px;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
}
.kb-super-demo-heading:before {
    content: '';
    position: absolute;
    border-bottom: 4px solid #dd4b39;
    width: 300px;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
}
.kb-demo-btn:hover {
    background-color: #22547f !important;
    border-color: #286090 !important;
}
  
    .kb-super-demo-content {
text-align: center;
display: flex;
flex-flow: row nowrap;
align-items: stretch;
}
    @media(max-width:1200px)
	{
	.kb-demo-btn{
            font-size:14px;
        }
	}
	
    @media(max-width:992px)
    {
        .kb-super-demo-content.col-lg-12 {
            width: 80%;
            margin: 0 auto;
        }
    }
    @media(max-width:767px)
    {
        .kb-super-demo-content.col-lg-12 {
            width: 100%;
            margin: 0 auto;
        }
        .kb-super-demo-content .col-lg-4.col-md-4.col-sm-4 {
            width: 100%;
            margin-bottom:10px;

            display:inline-block;
            padding:0;
        }
        .kb-demo-btn{
            width:100%;
			max-width: 250px;
        }
    }
    @media(max-width:600px)
    {
        .kb-super-demo-content.col-lg-12 {
            padding:0;
        }
		.kb-super-demo-heading:after {
                    width:30%;
                }
		.kb-super-demo-heading:before {
                    width:55%;
                }
    }
    @media(max-width:370px)
    {
        .kb-super-demo-content .col-lg-4.col-md-4.col-sm-4 {
            width: 100%;
            margin-bottom:5px;
        }
        .kb-super-demo-content .col-lg-4.col-md-4.col-sm-4 a {
            max-width: 100%;
        }
    }
    .kb-supercheckout-demo-blk {
padding-bottom: 20px;
}
@media(max-width:768px){
    .kb-supercheckout-demo-list {
display: none;
}
}

@media(max-width:992px) {
.kb-super-demo-content.col-lg-12 {
    width:100%!important;
}
.kb-demo-btn .fas{
    padding-right:10px;margin-right:10px;
}
}
</style>

{*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer tohttp://www.prestashop.com for more information.
* We offer the best and most useful modules PrestaShop and modifications for your online store.
*
* @category  PrestaShop Module
* @author    knowband.com <support@knowband.com>
* @copyright 2016 Knowband
*}